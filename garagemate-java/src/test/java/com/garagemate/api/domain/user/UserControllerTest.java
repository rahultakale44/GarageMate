package com.garagemate.api.domain.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.domain.user.dto.ChangePasswordRequest;
import com.garagemate.api.domain.user.dto.UpdateProfileRequest;
import com.garagemate.api.domain.user.dto.UserDto;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.config.TestSecurityConfig;
import com.garagemate.api.security.JwtAuthenticationFilter;
import com.garagemate.api.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = UserController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@Import(TestSecurityConfig.class)
@DisplayName("UserController (web layer)")
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean UserService userService;

    private UserDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = UserDto.builder()
                .id("1")
                .name("Alice")
                .email("alice@example.com")
                .mobile("9876543210")
                .role(UserRole.USER)
                .isBlocked(false)
                .build();

        // Inject authenticated principal into SecurityContext
        UserPrincipal principal = UserPrincipal.builder()
                .userId(1L)
                .email("alice@example.com")
                .role(UserRole.USER)
                .build();
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET /api/auth/me → 200 with user DTO")
    void getMe() throws Exception {
        given(userService.getProfile(1L)).willReturn(sampleDto);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("1"))
                .andExpect(jsonPath("$.data.email").value("alice@example.com"))
                .andExpect(jsonPath("$.data.password").doesNotExist())    // never exposed
                .andExpect(jsonPath("$.data.resetPasswordToken").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/users/profile → 200 with user DTO")
    void getProfile() throws Exception {
        given(userService.getProfile(1L)).willReturn(sampleDto);

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("1"));
    }

    @Test
    @DisplayName("PATCH /api/users/profile → 200 with updated DTO")
    void updateProfile() throws Exception {
        UserDto updated = UserDto.builder().id("1").name("Bob")
                .email("alice@example.com").role(UserRole.USER).build();
        given(userService.updateProfile(1L, new UpdateProfileRequest("Bob", null, null)))
                .willReturn(updated);

        mockMvc.perform(patch("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateProfileRequest("Bob", null, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                .andExpect(jsonPath("$.data.name").value("Bob"));
    }

    @Test
    @DisplayName("PATCH /api/users/password → 200 on success")
    void changePassword() throws Exception {
        doNothing().when(userService).changePassword(1L,
                new ChangePasswordRequest("oldPass", "newPass123"));

        mockMvc.perform(patch("/api/users/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ChangePasswordRequest("oldPass", "newPass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
    }

    @Test
    @DisplayName("PATCH /api/users/password → 400 when current password is wrong")
    void changePassword_wrongCurrentPassword() throws Exception {
        doThrow(ApiException.badRequest("Current password is incorrect"))
                .when(userService).changePassword(1L,
                        new ChangePasswordRequest("wrongPass", "newPass123"));

        mockMvc.perform(patch("/api/users/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ChangePasswordRequest("wrongPass", "newPass123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    @Test
    @DisplayName("PATCH /api/users/password → 422 when newPassword too short")
    void changePassword_validationFailure() throws Exception {
        mockMvc.perform(patch("/api/users/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"oldPass\",\"newPassword\":\"sh\"}"))
                .andExpect(status().isUnprocessableEntity());
    }
}
