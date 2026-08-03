package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.ChatbotActionDto;
import com.smartclinic.backend.dto.ChatbotRequestDto;
import com.smartclinic.backend.dto.ChatbotResponseDto;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.LiveChatMessage;
import com.smartclinic.backend.entity.LiveChatSenderType;
import com.smartclinic.backend.entity.LiveChatSession;
import com.smartclinic.backend.entity.LiveChatStatus;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.ScheduleStatus;
import com.smartclinic.backend.entity.Specialty;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.LiveChatMessageRepository;
import com.smartclinic.backend.repository.LiveChatSessionRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.BookingPolicy;
import com.smartclinic.backend.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatbotServiceImpl implements ChatbotService {

    private static final String WELCOME_MESSAGE =
            "Xin chào! Tôi là trợ lý lễ tân của Smart Clinic. Tôi có thể giúp bạn tìm bác sĩ, "
                    + "xem chuyên khoa, kiểm tra lịch trống và hướng dẫn đặt lịch.";

    private static final List<String> DEFAULT_REPLIES = List.of(
            "Tìm bác sĩ",
            "Xem chuyên khoa",
            "Đặt lịch khám",
            "Lịch hẹn của tôi"
    );

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final ScheduleRepository scheduleRepository;
    private final LiveChatSessionRepository liveChatSessionRepository;
    private final LiveChatMessageRepository liveChatMessageRepository;
    private final UserRepository userRepository;

    @Override
    public ChatbotResponseDto reply(
            ChatbotRequestDto request,
            String authenticatedEmail) {
        LiveChatSession session = getOrCreateSession(request, authenticatedEmail);
        LocalDateTime now = LocalDateTime.now();

        if (!liveChatMessageRepository.existsBySessionId(session.getId())) {
            saveChatMessage(
                    session,
                    LiveChatSenderType.CHATBOT,
                    null,
                    WELCOME_MESSAGE,
                    now
            );
        }

        User customer = session.getCustomer();
        saveChatMessage(
                session,
                LiveChatSenderType.CUSTOMER,
                customer,
                request.getMessage().trim(),
                now.plusNanos(1)
        );

        ChatbotResponseDto response = buildReply(request.getMessage());
        saveChatMessage(
                session,
                LiveChatSenderType.CHATBOT,
                null,
                response.getMessage(),
                now.plusNanos(2)
        );

        if (response.isHandoffRequested()) {
            session.setStatus(LiveChatStatus.WAITING);
            saveChatMessage(
                    session,
                    LiveChatSenderType.SYSTEM,
                    null,
                    "Yêu cầu đã được gửi. Vui lòng chờ lễ tân tiếp nhận.",
                    now.plusNanos(3)
            );
        }

        session.setLastMessageAt(now.plusNanos(response.isHandoffRequested() ? 3 : 2));
        liveChatSessionRepository.save(session);
        response.setSessionId(session.getId());
        response.setAccessToken(session.getAccessToken());
        return response;
    }

    private ChatbotResponseDto buildReply(String message) {
        String normalizedMessage = normalize(message);
        List<Specialty> specialties = specialtyRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();

        if (containsAny(normalizedMessage,
                "kho tho", "dau nguc du doi", "bat tinh", "chay mau nhieu", "cap cuu")) {
            return response(
                    "Triệu chứng bạn mô tả có thể cần được xử lý khẩn cấp. "
                            + "Vui lòng gọi dịch vụ cấp cứu tại địa phương hoặc đến cơ sở y tế gần nhất ngay; "
                            + "không nên chờ đặt lịch trực tuyến.",
                    List.of("Tìm bác sĩ", "Xem chuyên khoa"),
                    List.of()
            );
        }

        if (containsAny(normalizedMessage,
                "toi can noi chuyen voi le tan",
                "noi chuyen voi le tan",
                "gap le tan",
                "le tan that",
                "nhan vien le tan",
                "tu van vien",
                "noi chuyen voi nguoi that")) {
            return handoffResponse(
                    "Tôi đang chuyển bạn sang lễ tân trực tiếp. "
                            + "Bạn có thể tiếp tục nhắn tin trong cửa sổ này."
            );
        }

        Specialty matchingSpecialty = findMatchingSpecialty(normalizedMessage, specialties);
        if (matchingSpecialty != null) {
            return specialtyResponse(matchingSpecialty, doctors);
        }

        Doctor matchingDoctor = findMatchingDoctor(normalizedMessage, doctors);
        if (matchingDoctor != null) {
            return doctorResponse(matchingDoctor);
        }

        if (containsAny(normalizedMessage, "chuyen khoa", "khoa nao", "cac khoa")) {
            return specialtiesResponse(specialties);
        }

        if (containsAny(normalizedMessage,
                "danh gia cao", "rating cao", "tot nhat", "bac si tot", "top bac si")) {
            return topDoctorsResponse(doctors);
        }

        if (containsAny(normalizedMessage,
                "dat lich", "book", "hen kham", "dang ky kham")) {
            return response(
                    "Bạn có thể đặt lịch theo 4 bước: chọn chuyên khoa, chọn bác sĩ, "
                            + "chọn ngày/khung giờ và mô tả triệu chứng. "
                            + "Nếu chưa đăng nhập, hệ thống sẽ yêu cầu đăng nhập trước khi xác nhận.",
                    List.of("Tìm bác sĩ", "Xem chuyên khoa", "Lịch trống"),
                    List.of(new ChatbotActionDto("Đặt lịch khám", "/book"))
            );
        }

        if (containsAny(normalizedMessage,
                "lich trong", "lich kham", "gio trong", "khung gio", "con lich")) {
            return availableDoctorsResponse(doctors);
        }

        if (containsAny(normalizedMessage,
                "tim bac si", "bac si nao", "danh sach bac si", "xem bac si")) {
            return topDoctorsResponse(doctors);
        }

        if (containsAny(normalizedMessage,
                "lich hen cua toi", "lich da dat", "cuoc hen", "huy lich")) {
            return response(
                    "Trong “My Appointments”, bạn có thể xem toàn bộ lịch đã đặt, "
                            + "xem chi tiết và hủy lịch đang ở trạng thái PENDING.",
                    List.of("Đặt lịch khám", "Hồ sơ khám bệnh", "Gửi đánh giá"),
                    List.of(new ChatbotActionDto("Xem lịch hẹn của tôi", "/my-appointments"))
            );
        }

        if (containsAny(normalizedMessage,
                "ho so kham", "benh an", "medical record", "chan doan", "don thuoc")) {
            return response(
                    "Hồ sơ khám bệnh, chẩn đoán và đơn thuốc sẽ xuất hiện trong chi tiết lịch hẹn "
                            + "sau khi bác sĩ hoàn thành ca khám.",
                    List.of("Lịch hẹn của tôi", "Gửi đánh giá", "Đặt lịch khám"),
                    List.of(new ChatbotActionDto("Mở lịch hẹn", "/my-appointments"))
            );
        }

        if (containsAny(normalizedMessage,
                "danh gia", "feedback", "nhan xet", "rating")) {
            return response(
                    "Sau khi ca khám hoàn thành, bạn mở “My Appointments” và chọn "
                            + "“Viết đánh giá”. Mỗi ca khám chỉ gửi được một đánh giá từ 1 đến 5 sao.",
                    List.of("Lịch hẹn của tôi", "Tìm bác sĩ"),
                    List.of(new ChatbotActionDto("Mở lịch hẹn", "/my-appointments"))
            );
        }

        if (containsAny(normalizedMessage,
                "thanh toan", "hoa don", "chi phi", "phi kham", "gia kham")) {
            return response(
                    "Phí khám được hiển thị trong hồ sơ bác sĩ. Sau khi khám xong, "
                            + "hóa đơn sẽ gồm phí khám và tiền thuốc (nếu có).",
                    List.of("Tìm bác sĩ", "Đặt lịch khám", "Lịch hẹn của tôi"),
                    List.of(new ChatbotActionDto("Xem bác sĩ", "/search"))
            );
        }

        if (containsAny(normalizedMessage,
                "lien he", "so dien thoai", "email", "ho tro")) {
            return response(
                    "Bạn có thể liên hệ Smart Clinic qua email support@smartclinic.com "
                            + "hoặc số điện thoại +84 587 205 181.",
                    DEFAULT_REPLIES,
                    List.of()
            );
        }

        if (containsAny(normalizedMessage,
                "cam on", "thank", "thanks")) {
            return response(
                    "Rất vui được hỗ trợ bạn. Nếu cần, bạn có thể chọn một nội dung bên dưới.",
                    DEFAULT_REPLIES,
                    List.of()
            );
        }

        if (containsAny(normalizedMessage,
                "xin chao", "chao", "hello", "hi", "alo")) {
            return response(
                    "Xin chào! Tôi là trợ lý lễ tân của Smart Clinic. "
                            + "Tôi có thể giúp bạn tìm bác sĩ, xem chuyên khoa, kiểm tra lịch trống "
                            + "và hướng dẫn đặt lịch.",
                    DEFAULT_REPLIES,
                    List.of()
            );
        }

        return response(
                "Tôi chưa hiểu rõ yêu cầu. Bạn có thể hỏi tên bác sĩ/chuyên khoa, "
                        + "lịch trống, cách đặt lịch, hồ sơ khám bệnh hoặc đánh giá sau khám.",
                DEFAULT_REPLIES,
                List.of(
                        new ChatbotActionDto("Tìm kiếm bác sĩ", "/search"),
                        new ChatbotActionDto("Đặt lịch khám", "/book")
                )
        );
    }

    private ChatbotResponseDto specialtiesResponse(List<Specialty> specialties) {
        if (specialties.isEmpty()) {
            return response(
                    "Hiện hệ thống chưa có chuyên khoa nào. Vui lòng thử lại sau.",
                    List.of("Tìm bác sĩ", "Liên hệ hỗ trợ"),
                    List.of()
            );
        }

        List<Specialty> displayed = specialties.stream()
                .sorted(Comparator.comparing(Specialty::getName))
                .limit(6)
                .toList();
        String names = displayed.stream()
                .map(Specialty::getName)
                .collect(Collectors.joining(", "));
        List<ChatbotActionDto> actions = displayed.stream()
                .map(specialty -> new ChatbotActionDto(
                        specialty.getName(), "/specialty/" + specialty.getId()))
                .toList();

        return response(
                "Các chuyên khoa hiện có: " + names + ". Bạn muốn xem bác sĩ của chuyên khoa nào?",
                List.of("Tìm bác sĩ", "Bác sĩ đánh giá cao", "Đặt lịch khám"),
                actions
        );
    }

    private ChatbotResponseDto specialtyResponse(Specialty specialty, List<Doctor> allDoctors) {
        List<Doctor> doctors = allDoctors.stream()
                .filter(doctor -> doctor.getSpecialty() != null
                        && doctor.getSpecialty().getId().equals(specialty.getId()))
                .sorted(doctorComparator())
                .limit(5)
                .toList();

        if (doctors.isEmpty()) {
            return response(
                    "Chuyên khoa " + specialty.getName()
                            + " hiện chưa có bác sĩ nhận lịch. Bạn có thể xem chuyên khoa khác.",
                    List.of("Xem chuyên khoa", "Tìm bác sĩ"),
                    List.of(new ChatbotActionDto("Xem chuyên khoa", "/specialties"))
            );
        }

        String doctorNames = doctors.stream()
                .map(doctor -> doctor.getUser().getFullName())
                .collect(Collectors.joining(", "));
        List<ChatbotActionDto> actions = doctors.stream()
                .map(doctor -> new ChatbotActionDto(
                        "Xem " + doctor.getUser().getFullName(),
                        "/doctor/" + doctor.getId()))
                .toList();

        return response(
                "Chuyên khoa " + specialty.getName() + " có: " + doctorNames + ". "
                        + "Bạn có thể mở hồ sơ bác sĩ để xem rating và lịch trống.",
                List.of("Lịch trống", "Bác sĩ đánh giá cao", "Đặt lịch khám"),
                actions
        );
    }

    private ChatbotResponseDto topDoctorsResponse(List<Doctor> doctors) {
        List<Doctor> ratedDoctors = doctors.stream()
                .filter(doctor -> doctor.getTotalReviews() != null && doctor.getTotalReviews() > 0)
                .sorted(doctorComparator())
                .limit(5)
                .toList();
        boolean hasRatings = !ratedDoctors.isEmpty();
        List<Doctor> displayed = hasRatings
                ? ratedDoctors
                : doctors.stream().sorted(doctorComparator()).limit(5).toList();

        if (displayed.isEmpty()) {
            return response(
                    "Hiện hệ thống chưa có bác sĩ. Vui lòng thử lại sau.",
                    List.of("Xem chuyên khoa", "Liên hệ hỗ trợ"),
                    List.of()
            );
        }

        String summary = displayed.stream()
                .map(doctor -> {
                    String rating = hasRatings
                            ? " (" + formatRating(doctor.getAverageRating()) + "/5)"
                            : "";
                    return doctor.getUser().getFullName() + rating;
                })
                .collect(Collectors.joining(", "));
        List<ChatbotActionDto> actions = displayed.stream()
                .map(doctor -> new ChatbotActionDto(
                        "Xem " + doctor.getUser().getFullName(),
                        "/doctor/" + doctor.getId()))
                .toList();

        return response(
                (hasRatings ? "Các bác sĩ được đánh giá cao: " : "Các bác sĩ đang nhận lịch: ")
                        + summary + ".",
                List.of("Lịch trống", "Xem chuyên khoa", "Đặt lịch khám"),
                actions
        );
    }

    private ChatbotResponseDto availableDoctorsResponse(List<Doctor> doctors) {
        LocalDateTime now = LocalDateTime.now();
        List<Doctor> availableDoctors = doctors.stream()
                .filter(doctor -> scheduleRepository
                        .findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(
                                doctor.getId(), LocalDate.now(), ScheduleStatus.AVAILABLE)
                        .stream()
                        .anyMatch(schedule -> BookingPolicy.canBook(schedule, now)))
                .sorted(doctorComparator())
                .limit(5)
                .toList();

        if (availableDoctors.isEmpty()) {
            return response(
                    "Hiện chưa có lịch trống sắp tới. Vui lòng thử lại sau hoặc chọn bác sĩ khác.",
                    List.of("Tìm bác sĩ", "Xem chuyên khoa", "Liên hệ hỗ trợ"),
                    List.of(new ChatbotActionDto("Xem bác sĩ", "/search"))
            );
        }

        String names = availableDoctors.stream()
                .map(doctor -> doctor.getUser().getFullName())
                .collect(Collectors.joining(", "));
        List<ChatbotActionDto> actions = availableDoctors.stream()
                .map(doctor -> new ChatbotActionDto(
                        "Xem lịch " + doctor.getUser().getFullName(),
                        "/doctor/" + doctor.getId()))
                .toList();
        return response(
                "Các bác sĩ đang có lịch trống sắp tới: " + names
                        + ". Chọn bác sĩ để xem ngày và khung giờ cụ thể.",
                List.of("Bác sĩ đánh giá cao", "Xem chuyên khoa", "Đặt lịch khám"),
                actions
        );
    }

    private ChatbotResponseDto doctorResponse(Doctor doctor) {
        LocalDateTime now = LocalDateTime.now();
        List<Schedule> schedules =
                scheduleRepository.findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(
                                doctor.getId(), LocalDate.now(), ScheduleStatus.AVAILABLE)
                        .stream()
                        .filter(schedule -> BookingPolicy.canBook(schedule, now))
                        .toList();
        String specialtyName = doctor.getSpecialty() == null
                ? "chưa cập nhật chuyên khoa"
                : doctor.getSpecialty().getName();
        String rating = doctor.getTotalReviews() != null && doctor.getTotalReviews() > 0
                ? ", rating " + formatRating(doctor.getAverageRating()) + "/5"
                : ", chưa có đánh giá";

        String scheduleText;
        if (schedules.isEmpty()) {
            scheduleText = " Hiện bác sĩ chưa có lịch trống sắp tới.";
        } else {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String slots = schedules.stream()
                    .limit(3)
                    .map(schedule -> schedule.getDate().format(dateFormatter)
                            + " " + formatTime(schedule))
                    .collect(Collectors.joining(", "));
            scheduleText = " Lịch trống gần nhất: " + slots + ".";
        }

        return response(
                doctor.getUser().getFullName() + " thuộc " + specialtyName
                        + ", " + doctor.getExperience() + " năm kinh nghiệm" + rating + "."
                        + scheduleText,
                List.of("Đặt lịch khám", "Bác sĩ đánh giá cao", "Xem chuyên khoa"),
                List.of(
                        new ChatbotActionDto("Xem hồ sơ bác sĩ", "/doctor/" + doctor.getId()),
                        new ChatbotActionDto("Đặt lịch khám", "/book")
                )
        );
    }

    private Specialty findMatchingSpecialty(String message, List<Specialty> specialties) {
        return specialties.stream()
                .filter(specialty -> {
                    String normalizedName = normalize(specialty.getName());
                    String baseName = normalizedName.split("\\(")[0].trim();
                    return baseName.length() >= 3 && message.contains(baseName);
                })
                .findFirst()
                .orElse(null);
    }

    private Doctor findMatchingDoctor(String message, List<Doctor> doctors) {
        return doctors.stream()
                .filter(doctor -> {
                    String name = normalize(doctor.getUser().getFullName())
                            .replaceAll("\\b(bs|bac si|doctor|dr)\\b", " ")
                            .replaceAll("[^a-z0-9 ]", " ")
                            .replaceAll("\\s+", " ")
                            .trim();
                    if (name.length() >= 4 && message.contains(name)) {
                        return true;
                    }
                    String[] tokens = name.split(" ");
                    String lastName = tokens.length == 0 ? "" : tokens[tokens.length - 1];
                    return lastName.length() >= 4
                            && message.matches(".*\\b" + java.util.regex.Pattern.quote(lastName) + "\\b.*");
                })
                .findFirst()
                .orElse(null);
    }

    private Comparator<Doctor> doctorComparator() {
        return Comparator
                .comparing(
                        (Doctor doctor) -> doctor.getAverageRating() == null
                                ? BigDecimal.ZERO
                                : doctor.getAverageRating(),
                        Comparator.reverseOrder())
                .thenComparing(
                        doctor -> doctor.getTotalReviews() == null ? 0 : doctor.getTotalReviews(),
                        Comparator.reverseOrder())
                .thenComparing(doctor -> doctor.getUser().getFullName());
    }

    private String formatRating(BigDecimal rating) {
        return rating == null ? "0.0" : String.format(Locale.US, "%.1f", rating);
    }

    private String formatTime(Schedule schedule) {
        return schedule.getStartTime().toString().substring(0, 5)
                + "-" + schedule.getEndTime().toString().substring(0, 5);
    }

    private ChatbotResponseDto response(
            String message, List<String> quickReplies, List<ChatbotActionDto> actions) {
        return new ChatbotResponseDto(
                message,
                new ArrayList<>(quickReplies),
                new ArrayList<>(actions),
                false
        );
    }

    private ChatbotResponseDto handoffResponse(String message) {
        return new ChatbotResponseDto(
                message,
                List.of(),
                List.of(),
                true
        );
    }

    private LiveChatSession getOrCreateSession(
            ChatbotRequestDto request,
            String authenticatedEmail) {
        boolean hasSessionId = request.getSessionId() != null;
        boolean hasAccessToken = StringUtils.hasText(request.getAccessToken());
        if (hasSessionId || hasAccessToken) {
            if (!hasSessionId || !hasAccessToken) {
                throw new IllegalArgumentException("Thiếu thông tin phiên chat.");
            }

            LiveChatSession session = liveChatSessionRepository
                    .findByIdForUpdate(request.getSessionId())
                    .orElseThrow(() -> new IllegalArgumentException("Phiên chat không tồn tại."));
            verifyAccessToken(session, request.getAccessToken());
            if (session.getStatus() != LiveChatStatus.BOT) {
                throw new IllegalArgumentException(
                        "Phiên chat này đã được chuyển cho lễ tân hoặc đã kết thúc."
                );
            }
            return session;
        }

        User customer = findPatient(authenticatedEmail);
        String customerName = customer != null
                ? customer.getFullName()
                : normalizeCustomerName(request.getCustomerName());
        LocalDateTime now = LocalDateTime.now();
        return liveChatSessionRepository.save(
                LiveChatSession.builder()
                        .accessToken(UUID.randomUUID().toString())
                        .customer(customer)
                        .customerName(customerName)
                        .status(LiveChatStatus.BOT)
                        .createdAt(now)
                        .lastMessageAt(now)
                        .build()
        );
    }

    private LiveChatMessage saveChatMessage(
            LiveChatSession session,
            LiveChatSenderType senderType,
            User sender,
            String content,
            LocalDateTime createdAt) {
        return liveChatMessageRepository.save(
                LiveChatMessage.builder()
                        .session(session)
                        .senderType(senderType)
                        .sender(sender)
                        .content(content)
                        .createdAt(createdAt)
                        .build()
        );
    }

    private User findPatient(String email) {
        if (!StringUtils.hasText(email) || "anonymousUser".equals(email)) {
            return null;
        }
        return userRepository.findByEmail(email)
                .filter(user -> user.getRole() == Role.PATIENT)
                .orElse(null);
    }

    private String normalizeCustomerName(String customerName) {
        return StringUtils.hasText(customerName)
                ? customerName.trim()
                : "Khách hàng";
    }

    private void verifyAccessToken(LiveChatSession session, String accessToken) {
        boolean matches = MessageDigest.isEqual(
                session.getAccessToken().getBytes(StandardCharsets.UTF_8),
                accessToken.getBytes(StandardCharsets.UTF_8)
        );
        if (!matches) {
            throw new AccessDeniedException("Mã truy cập phiên chat không hợp lệ.");
        }
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9() ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
