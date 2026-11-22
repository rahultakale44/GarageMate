package com.garagemate.api.domain.user;

import com.garagemate.api.domain.auth.RefreshTokenRepository;
import com.garagemate.api.domain.user.dto.ChangePasswordRequest;
import com.garagemate.api.domain.user.dto.UpdateProfileRequest;
import com.garagemate.api.domain.user.dto.UserDto;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.cloudinary.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CloudinaryService cloudinaryService;

    @InjectMocks private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .mobile("9876543210")
                .password("$2a$10$hashedpassword")
                .role(UserRole.USER)
                .isBlocked(false)
                .build();
    }

    // ── getProfile ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getProfile")
    class GetProfile {

        @Test
        @DisplayName("returns UserDto without sensitive fields")
        void returnsDto() {
            given(userRepository.findById(1L)).willReturn(Optional.of(sampleUser));

            UserDto dto = userService.getProfile(1L);

            assertThat(dto.getId()).isEqualTo("1");        // BIGINT → String
            assertThat(dto.getName()).isEqualTo("Alice");
            assertThat(dto.getEmail()).isEqualTo("alice@example.com");
        }

        @Test
        @DisplayName("throws 404 when user not found")
        void throwsNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getProfile(99L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ── updateProfile ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateProfile")
    class UpdateProfile {

        @Test
        @DisplayName("updates only provided fields")
        void updatesProvidedFields() {
            given(userRepository.findById(1L)).willReturn(Optional.of(sampleUser));
            given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest req = new UpdateProfileRequest("Bob", null, null);
            UserDto dto = userService.updateProfile(1L, req);

            assertThat(dto.getName()).isEqualTo("Bob");
            assertThat(dto.getMobile()).isEqualTo("9876543210"); // unchanged
        }

        @Test
        @DisplayName("does not change name when null")
        void skipsNullFields() {
            given(userRepository.findById(1L)).willReturn(Optional.of(sampleUser));
            given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest req = new UpdateProfileRequest(null, "9000000000", null);
            UserDto dto = userService.updateProfile(1L, req);

            assertThat(dto.getName()).isEqualTo("Alice");    // unchanged
            assertThat(dto.getMobile()).isEqualTo("9000000000");
        }

        @Test
        @DisplayName("throws 404 for unknown user")
        void throwsNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateProfile(99L,
                    new UpdateProfileRequest("X", null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ── changePassword ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("changePassword")
    class ChangePassword {

        @Test
        @DisplayName("changes password and revokes all sessions")
        void changesPasswordAndRevokes() {
            given(userRepository.findById(1L)).willReturn(Optional.of(sampleUser));
            given(passwordEncoder.matches("oldPass", sampleUser.getPassword())).willReturn(true);
            given(passwordEncoder.encode("newPass123")).willReturn("$2a$10$newhash");
            given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

            userService.changePassword(1L, new ChangePasswordRequest("oldPass", "newPass123"));

            verify(passwordEncoder).encode("newPass123");
            verify(refreshTokenRepository).deleteAllByUserId(1L);
        }

        @Test
        @DisplayName("rejects wrong current password")
        void rejectsWrongCurrentPassword() {
            given(userRepository.findById(1L)).willReturn(Optional.of(sampleUser));
            given(passwordEncoder.matches("wrongPass", sampleUser.getPassword())).willReturn(false);

            assertThatThrownBy(() -> userService.changePassword(1L,
                    new ChangePasswordRequest("wrongPass", "newPass123")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Current password is incorrect");

            verify(userRepository, never()).save(any());
            verify(refreshTokenRepository, never()).deleteAllByUserId(anyLong());
        }

        @Test
        @DisplayName("rejects password change for Google-only accounts")
        void rejectsGoogleAccount() {
            User googleUser = User.builder()
                    .id(2L)
                    .name("Bob")
                    .email("bob@gmail.com")
                    .password(null)   // no password — Google-only
                    .role(UserRole.USER)
                    .googleId("google-uid-123")
                    .build();
            given(userRepository.findById(2L)).willReturn(Optional.of(googleUser));

            assertThatThrownBy(() -> userService.changePassword(2L,
                    new ChangePasswordRequest("any", "newPass123")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Google sign-in");

            verify(passwordEncoder, never()).matches(any(), any());
        }
    }
}
