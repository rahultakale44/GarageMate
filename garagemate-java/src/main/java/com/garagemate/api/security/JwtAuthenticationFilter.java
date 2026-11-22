package com.garagemate.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.exception.ApiException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads Bearer token from Authorization header, validates it, and sets
 * the Spring Security context. Mirrors the Node.js authenticate middleware.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            JwtClaims claims = jwtTokenProvider.parseAccessToken(token);

            UserPrincipal principal = UserPrincipal.builder()
                    .userId(claims.getUserId())
                    .email(claims.getEmail())
                    .role(claims.getRole())
                    .build();

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + claims.getRole().name()));

            var authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (ApiException ex) {
            sendUnauthorized(response, ex.getMessage());
            return;
        } catch (Exception ex) {
            log.debug("JWT filter error: {}", ex.getMessage());
            sendUnauthorized(response, "Invalid or expired token");
            return;
        }

        chain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                objectMapper.writeValueAsString(ApiResponse.error(message)));
    }
}
