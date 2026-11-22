package com.garagemate.api.domain.garage;

import com.garagemate.api.common.AppConstants;
import com.garagemate.api.domain.garage.dto.*;
import com.garagemate.api.domain.garage.pricing.GarageServicePricing;
import com.garagemate.api.domain.garage.pricing.GarageServicePricingRepository;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.cloudinary.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GarageService — mirrors Node.js garageController.ts.
 *
 * Public endpoints:
 *   GET  /api/garages/nearby         — Haversine nearby search
 *   GET  /api/garages/reverse-geocode — Nominatim reverse geocode
 *   GET  /api/garages/geocode         — Nominatim forward geocode
 *   GET  /api/garages                 — paginated list (APPROVED only)
 *   GET  /api/garages/:id             — single garage
 *
 * Owner endpoints:
 *   GET   /api/garages/my/profile     — get own garage
 *   PATCH /api/garages/my/profile     — update own garage (restricted fields)
 *   PATCH /api/garages/my/availability — toggle isAvailable
 *   POST  /api/garages/my/images      — add images (JSON urls or multipart)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GarageService {

    private final GarageRepository garageRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final GarageServicePricingRepository pricingRepository;

    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    // ── Public: nearby search ─────────────────────────────────────────────────

    /**
     * Haversine nearby search + per-garage isOpen calculation.
     * Mirrors Node.js: Garage.find({ location: { $near: ... }, verificationStatus: APPROVED })
     *
     * Applies optional filters: serviceType, vehicleType, minimumRating, openNow/is24x7.
     * Returns up to 50 garages, sorted by distance ascending.
     */
    @Transactional(readOnly = true)
    public List<GarageDto> searchNearby(NearbySearchParams params) {
        double radius = Math.min(params.getRadiusKm(), AppConstants.MAX_SEARCH_RADIUS_KM);

        // Step 1: single query returns (id, distanceKm) pairs, ordered by distance ASC
        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                params.getLatitude(), params.getLongitude(), radius, 50);

        if (rows.isEmpty()) return List.of();

        // Step 2: build ordered id list + distance map in one pass
        List<Long> orderedIds = new ArrayList<>(rows.size());
        Map<Long, Double> distanceMap = new LinkedHashMap<>(rows.size());
        for (Object[] row : rows) {
            Long id  = row[0] instanceof Number n ? n.longValue() : null;
            if (id == null) continue;
            double km = row[1] instanceof Number n ? n.doubleValue() : 0.0;
            orderedIds.add(id);
            distanceMap.put(id, km);
        }

        // Step 3: batch-fetch all garage entities in one IN query (no N+1)
        List<Garage> entities = garageRepository.findAllByIdIn(orderedIds);
        Map<Long, Garage> garageMap = entities.stream()
                .collect(Collectors.toMap(Garage::getId, g -> g));

        // Step 4: reconstruct in distance order, applying in-memory filters
        List<GarageDto> results = new ArrayList<>();
        for (Long id : orderedIds) {
            Garage garage = garageMap.get(id);
            if (garage == null) continue;

            if (!passesFilters(garage, params)) continue;

            boolean isOpen = isGarageOpen(garage);
            if ((params.isOpenNow() || params.is24x7()) && !isOpen) continue;

            double distKm = distanceMap.get(id);
            results.add(GarageDto.from(garage, distKm, isOpen));
        }
        return results;
    }

    // ── Public: paginated list ────────────────────────────────────────────────

    /**
     * GET /api/garages?city=&search=&minRating=&page=&limit=
     * Only APPROVED garages. Sorted by rating desc.
     * Mirrors Node.js getGarages.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listGarages(String city, String search,
                                            Double minRating, int page, int limit) {
        int safePage  = Math.max(0, page - 1);               // convert 1-based to 0-based
        int safeLimit = Math.min(limit, AppConstants.MAX_PAGE_SIZE);

        // Load all APPROVED garages for this page (filtered in DB where possible)
        Page<Garage> dbPage = garageRepository.findByVerificationStatus(
                VerificationStatus.APPROVED,
                PageRequest.of(safePage, safeLimit, Sort.by("rating").descending()
                        .and(Sort.by("reviewCount").descending())));

        List<GarageDto> data = dbPage.getContent().stream()
                .filter(g -> matchesTextFilter(g, city, search, minRating))
                .map(GarageDto::from)
                .toList();

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", page);
        pagination.put("limit", safeLimit);
        pagination.put("total", dbPage.getTotalElements());
        pagination.put("pages", dbPage.getTotalPages());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", data);
        result.put("pagination", pagination);
        return result;
    }

    // ── Public: single garage ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GarageDto getGarage(Long garageId) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));
        return GarageDto.from(garage);
    }

    // ── Owner: get own garage ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GarageDto getMyGarage(Long ownerId) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));
        return GarageDto.from(garage);
    }

    // ── Owner: update garage ──────────────────────────────────────────────────

    /**
     * Owner can update: name, phone, address, city, state, pincode, coordinates,
     * serviceRadius, services, supportedVehicleTypes, openingTime, closingTime,
     * weeklyOff, is24x7, numberOfMechanics, visitingCharge.
     *
     * Owner CANNOT change: verificationStatus, rating, reviewCount, isDemo, owner.
     * Coordinates accepted as latitude/longitude — stored separately in DB
     * (no MySQL POINT column — stored as DECIMAL latitude/longitude).
     */
    @Transactional
    public GarageDto updateGarage(Long ownerId, UpdateGarageRequest req) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        if (req.name()              != null) garage.setName(req.name().trim());
        if (req.phone()             != null) garage.setPhone(req.phone().trim());
        if (req.address()           != null) garage.setAddress(req.address().trim());
        if (req.city()              != null) garage.setCity(req.city().trim());
        if (req.state()             != null) garage.setState(req.state().trim());
        if (req.pincode()           != null) garage.setPincode(req.pincode().trim());
        if (req.serviceRadius()     != null) garage.setServiceRadius(req.serviceRadius());
        if (req.openingTime()       != null) garage.setOpeningTime(req.openingTime());
        if (req.closingTime()       != null) garage.setClosingTime(req.closingTime());
        if (req.weeklyOff()         != null) garage.setWeeklyOff(req.weeklyOff());
        if (req.is24x7()            != null) garage.set24x7(req.is24x7());
        if (req.numberOfMechanics() != null) garage.setNumberOfMechanics(req.numberOfMechanics());
        if (req.visitingCharge()    != null) garage.setVisitingCharge(req.visitingCharge());
        if (req.services()          != null) {
            garage.getServices().clear();
            garage.getServices().addAll(req.services());
        }
        if (req.supportedVehicleTypes() != null) {
            garage.getSupportedVehicleTypes().clear();
            garage.getSupportedVehicleTypes().addAll(req.supportedVehicleTypes());
        }
        // Coordinates — only update when both are provided
        if (req.latitude() != null && req.longitude() != null) {
            garage.setLatitude(req.latitude());
            garage.setLongitude(req.longitude());
        }

        // Replace servicePricing atomically when provided
        if (req.servicePricing() != null) {
            pricingRepository.deleteByGarageId(garage.getId());
            req.servicePricing().forEach((serviceName, price) -> {
                if (price != null && price.compareTo(BigDecimal.ZERO) >= 0) {
                    pricingRepository.save(GarageServicePricing.builder()
                            .garage(garage)
                            .serviceName(serviceName)
                            .price(price)
                            .build());
                }
            });
        }

        Garage saved = garageRepository.save(garage);
        log.info("Garage updated id={} by ownerId={}", saved.getId(), ownerId);
        return GarageDto.from(saved);
    }

    // ── Owner: toggle availability ────────────────────────────────────────────

    @Transactional
    public Map<String, Boolean> toggleAvailability(Long ownerId, boolean isAvailable) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        garage.setAvailable(isAvailable);
        garageRepository.save(garage);
        log.info("Garage {} availability={} by ownerId={}", garage.getId(), isAvailable, ownerId);
        return Map.of("isAvailable", isAvailable);
    }

    // ── Owner: add images (JSON upload results) ───────────────────────────────

    /**
     * POST /api/garages/my/images  — JSON body { images: [{ url, publicId, type }] }
     * Mirrors Node.js addGarageImages: pushes pre-uploaded Cloudinary URLs.
     * Frontend handles Cloudinary upload separately and posts resulting URLs here.
     */
    @Transactional
    public List<GarageImageDto> addImages(Long ownerId, AddImagesRequest req) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        for (AddImagesRequest.ImageEntry entry : req.images()) {
            GarageImage img = GarageImage.builder()
                    .garage(garage)
                    .url(entry.url())
                    .publicId(entry.publicId())
                    .imageType(entry.type())
                    .build();
            garage.getImages().add(img);
        }

        garageRepository.save(garage);
        log.info("Added {} images to garageId={}", req.images().size(), garage.getId());
        return garage.getImages().stream().map(GarageImageDto::from).toList();
    }

    /**
     * POST /api/garages/my/images — multipart upload directly to Cloudinary.
     * Alternative to the JSON endpoint when frontend posts files directly.
     */
    @Transactional
    public List<GarageImageDto> uploadImages(Long ownerId, List<MultipartFile> files) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String ct = file.getContentType();
            if (ct == null || !ct.startsWith("image/")) {
                throw ApiException.badRequest("Only image files are allowed");
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                throw ApiException.badRequest("Image file size must not exceed 5 MB");
            }
            // Upload to Cloudinary FIRST; only add DB record if upload succeeds
            String url;
            try {
                url = cloudinaryService.upload(file, "garagemate/garages");
            } catch (IOException e) {
                log.error("Image upload failed for garageId={}: {}", garage.getId(), e.getMessage());
                throw ApiException.internal("Image upload failed: " + e.getMessage());
            }
            String publicId = cloudinaryService.extractPublicId(url);
            // DB write happens only after successful Cloudinary upload
            GarageImage img = GarageImage.builder()
                    .garage(garage)
                    .url(url)
                    .publicId(publicId)
                    .imageType("gallery")
                    .build();
            garage.getImages().add(img);
        }

        garageRepository.save(garage);
        return garage.getImages().stream().map(GarageImageDto::from).toList();
    }

    /**
     * Delete a specific image by publicId — called when owner removes an image.
     */
    @Transactional
    public void deleteImage(Long ownerId, String publicId) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        boolean removed = garage.getImages()
                .removeIf(img -> publicId.equals(img.getPublicId()));

        if (!removed) {
            throw ApiException.notFound("Image not found");
        }

        // Persist DB change first; only delete Cloudinary asset after DB commit
        garageRepository.save(garage);

        // Best-effort Cloudinary deletion — log failure but don't rollback DB
        // (asset can be cleaned up later via Cloudinary console or reconciliation job)
        try {
            cloudinaryService.delete(publicId);
        } catch (Exception e) {
            log.warn("Cloudinary deletion failed for publicId={} (DB record removed): {}",
                    publicId, e.getMessage());
        }
        log.info("Deleted image publicId={} from garageId={}", publicId, garage.getId());
    }

    // ── Package-visible: used by AuthService on garage registration ───────────

    /**
     * Creates a new Garage record when a GARAGE_OWNER registers.
     * Sets verificationStatus = PENDING (never APPROVED on creation).
     */
    @Transactional
    public Garage createGarageForOwner(User owner,
                                        com.garagemate.api.domain.auth.dto.RegisterGarageRequest req) {
        if (garageRepository.existsByOwnerId(owner.getId())) {
            throw ApiException.conflict("This account already has a garage");
        }

        Garage garage = Garage.builder()
                .owner(owner)
                .name(req.getGarageName().trim())
                .phone(req.getGaragePhone().trim())
                .address(req.getAddress().trim())
                .city(req.getCity().trim())
                .state(req.getState().trim())
                .pincode(req.getPincode().trim())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .serviceRadius(req.getServiceRadius() != null ? req.getServiceRadius() : 10)
                .is24x7(req.getIs24x7() != null && req.getIs24x7())
                .numberOfMechanics(req.getNumberOfMechanics() != null
                        ? req.getNumberOfMechanics() : 1)
                .verificationStatus(VerificationStatus.PENDING)
                .isAvailable(true)
                .visitingCharge(new BigDecimal("99.00"))
                .build();

        garage.getServices().addAll(req.getServices());
        garage.getSupportedVehicleTypes().addAll(req.getSupportedVehicleTypes());

        if (!garage.is24x7()) {
            garage.setOpeningTime(req.getOpeningTime());
            garage.setClosingTime(req.getClosingTime());
        }
        if (req.getWeeklyOff() != null) {
            garage.setWeeklyOff(req.getWeeklyOff());
        }

        Garage saved = garageRepository.save(garage);
        log.info("Garage created id={} for ownerId={} status=PENDING",
                saved.getId(), owner.getId());
        return saved;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * isGarageOpen — mirrors Node.js isGarageOpen().
     * Returns true for 24x7, false on weekly off day, checks opening/closing hours.
     */
    boolean isGarageOpen(Garage garage) {
        if (garage.is24x7()) return true;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        // Check weekly off day
        if (garage.getWeeklyOff() != null && !garage.getWeeklyOff().isBlank()) {
            String todayShort = now.getDayOfWeek().getDisplayName(
                    java.time.format.TextStyle.SHORT, Locale.ENGLISH); // "Mon", "Tue"…
            if (todayShort.equalsIgnoreCase(garage.getWeeklyOff())) return false;
        }

        // Check opening/closing time (HH:mm)
        try {
            if (garage.getOpeningTime() != null && garage.getClosingTime() != null) {
                LocalTime open  = LocalTime.parse(garage.getOpeningTime(),
                        DateTimeFormatter.ofPattern("H:mm"));
                LocalTime close = LocalTime.parse(garage.getClosingTime(),
                        DateTimeFormatter.ofPattern("H:mm"));
                LocalTime current = now.toLocalTime();
                return !current.isBefore(open) && current.isBefore(close);
            }
        } catch (Exception e) {
            log.debug("Could not parse operating hours for garageId={}", garage.getId());
        }
        return true; // Default open if times not set
    }

    private boolean passesFilters(Garage garage, NearbySearchParams params) {
        // Service filter
        String svcType = params.getServiceType();
        String svcs    = params.getServices();
        if (svcType != null && !svcType.isBlank()) {
            if (!garage.getServices().contains(svcType)) return false;
        } else if (svcs != null && !svcs.isBlank()) {
            Set<String> requested = Arrays.stream(svcs.split(","))
                    .map(String::trim).collect(Collectors.toSet());
            if (garage.getServices().stream().noneMatch(requested::contains)) return false;
        }

        // Vehicle type filter
        if (params.getVehicleType() != null) {
            if (!garage.getSupportedVehicleTypes().contains(params.getVehicleType())) return false;
        }

        // Rating filter
        if (params.getMinRating() != null) {
            if (garage.getRating().doubleValue() < params.getMinRating()) return false;
        }

        return true;
    }

    private boolean matchesTextFilter(Garage g, String city, String search, Double minRating) {
        if (city != null && !city.isBlank()
                && !g.getCity().toLowerCase().contains(city.toLowerCase())) return false;

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            boolean nameMatch    = g.getName().toLowerCase().contains(q);
            boolean addressMatch = g.getAddress().toLowerCase().contains(q);
            if (!nameMatch && !addressMatch) return false;
        }

        if (minRating != null && g.getRating().doubleValue() < minRating) return false;

        return true;
    }

    private Long extractLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
