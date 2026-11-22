package com.garagemate.api.domain.garage.dto;

import com.garagemate.api.domain.user.User;
import lombok.Builder;
import lombok.Getter;

/**
 * Safe owner summary embedded in garage responses.
 * Mirrors Node.js populate('owner', 'name avatar email phone').
 * Never exposes password or sensitive fields.
 */
@Getter
@Builder
public class GarageOwnerDto {
    private final String _id;      // frontend uses _id
    private final String name;
    private final String email;
    private final String phone;
    private final String avatar;

    public static GarageOwnerDto from(User user) {
        return GarageOwnerDto.builder()
                ._id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getMobile())
                .avatar(user.getAvatar())
                .build();
    }
}
