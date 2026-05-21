import SwiftUI
import UserNotifications

struct AccountView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var notifications: NotificationsManager
    @EnvironmentObject private var pickStatus: PickStatusStore
    @State private var isSigningOut = false
    @State private var isEditingDefault = false

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

                Section {
                    Button {
                        isEditingDefault = true
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Monto por pick")
                                    .foregroundStyle(.primary)
                                Text(defaultInvestmentSubtitle)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(defaultInvestmentDisplay)
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("Picks")
                } footer: {
                    Text("Se pre-rellena cuando marcas un pick como comprado. Lo puedes editar pick por pick.")
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
            .task { await auth.refreshCurrentUser() }
            .task {
                if pickStatus.picks.isEmpty {
                    await pickStatus.load()
                }
            }
            .refreshable {
                await auth.refreshCurrentUser()
                await pickStatus.load()
            }
            .sheet(isPresented: $isEditingDefault) {
                DefaultInvestmentSheet(current: pickStatus.defaultInvestment) { newValue in
                    Task { await pickStatus.updateDefaultInvestment(newValue) }
                }
                .presentationDetents([.height(280)])
            }
        }
    }

    private var defaultInvestmentDisplay: String {
        guard let amount = pickStatus.defaultInvestment else { return "No fijado" }
        return formatAmount(amount)
    }

    private var defaultInvestmentSubtitle: String {
        pickStatus.defaultInvestment == nil
            ? "Te lo preguntamos en cada pick"
            : "Pre-rellenamos este monto"
    }

    private func formatAmount(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = value.truncatingRemainder(dividingBy: 1) == 0 ? 0 : 2
        return f.string(from: NSNumber(value: value)) ?? "$\(value)"
    }

    private func statusLabel(_ user: UserProfile) -> String {
        if user.isSubscribed { return "Active" }
        return user.subscriptionStatus?.capitalized ?? "Free"
    }
}

private struct DefaultInvestmentSheet: View {
    let current: Double?
    let onSave: (Double?) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var text: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Text("$")
                            .foregroundStyle(.secondary)
                        TextField("50", text: $text)
                            .keyboardType(.decimalPad)
                    }
                } header: {
                    Text("Monto por pick")
                } footer: {
                    Text("Cuando marques un pick como comprado, este monto aparecerá pre-rellenado.")
                }

                if current != nil {
                    Section {
                        Button("Quitar monto por defecto", role: .destructive) {
                            onSave(nil)
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle("Monto por pick")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        if let value = parsed { onSave(value) }
                        dismiss()
                    }
                    .disabled(parsed == nil)
                }
            }
            .onAppear {
                if let c = current { text = trimTrailingZeros(c) }
            }
        }
    }

    private var parsed: Double? {
        let cleaned = text.replacingOccurrences(of: ",", with: ".")
        guard let value = Double(cleaned), value > 0 else { return nil }
        return value
    }

    private func trimTrailingZeros(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(value))
            : String(format: "%.2f", value)
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
