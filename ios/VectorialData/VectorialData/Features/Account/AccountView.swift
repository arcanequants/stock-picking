import SwiftUI
import UserNotifications

struct AccountView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var notifications: NotificationsManager
    @State private var isSigningOut = false

    var body: some View {
        NavigationStack {
            List {
                if let user = auth.currentUser {
                    Section("Account") {
                        LabeledContent("Email", value: user.email)
                        LabeledContent("Status", value: statusLabel(user))
                        if let channel = user.deliveryChannel {
                            LabeledContent("Delivery", value: channel)
                        }
                        if let locale = user.locale {
                            LabeledContent("Language", value: locale)
                        }
                    }
                }

                Section("Notifications") {
                    NotificationsRow(status: notifications.authorizationStatus) {
                        Task { await notifications.requestAuthorization() }
                    }
                }

                Section {
                    Button(role: .destructive) {
                        isSigningOut = true
                        Task {
                            await notifications.unregister()
                            await auth.signOut()
                            isSigningOut = false
                        }
                    } label: {
                        HStack {
                            Text("Sign out")
                            Spacer()
                            if isSigningOut { ProgressView() }
                        }
                    }
                    .disabled(isSigningOut)
                }
            }
            .navigationTitle("Account")
            .task { await notifications.refreshStatus() }
        }
    }

    private func statusLabel(_ user: UserProfile) -> String {
        if user.isSubscribed { return "Active" }
        return user.subscriptionStatus?.capitalized ?? "Free"
    }
}

private struct NotificationsRow: View {
    let status: UNAuthorizationStatus
    let onEnable: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("New pick alerts").font(.body)
                Text(statusText).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            switch status {
            case .notDetermined:
                Button("Enable", action: onEnable)
                    .buttonStyle(.borderedProminent)
                    .tint(Color("BrandEmerald"))
            case .denied:
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .buttonStyle(.bordered)
            case .authorized, .provisional, .ephemeral:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color("BrandEmerald"))
            @unknown default:
                EmptyView()
            }
        }
    }

    private var statusText: String {
        switch status {
        case .notDetermined: return "Get notified the second a new pick drops."
        case .denied: return "Enable in Settings to receive pick alerts."
        case .authorized, .provisional, .ephemeral: return "Enabled."
        @unknown default: return ""
        }
    }
}
