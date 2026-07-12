import SwiftUI
import StoreKit
import UserNotifications

struct AccountView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var notifications: NotificationsManager
    @EnvironmentObject private var pickStatus: PickStatusStore
    @State private var isSigningOut = false
    @State private var isEditingDefault = false
    @State private var showDeleteConfirm = false
    @State private var showManageSubs = false
    @State private var showTrial = false
    @State private var restoring = false
    @State private var isDeleting = false
    @State private var deleteError: String?

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
                    if auth.currentUser?.isSubscribed == true {
                        Button {
                            showManageSubs = true
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Administrar suscripción")
                                    .foregroundStyle(.primary)
                                Text("Renueva o cancela — lo maneja Apple")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    } else {
                        Button {
                            showTrial = true
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Activar 14 días gratis")
                                    .foregroundStyle(Color("BrandEmerald"))
                                Text("Luego $0.99/mes · cancela cuando quieras")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Button {
                            restoring = true
                            Task {
                                _ = await StoreManager.shared.restore()
                                await auth.refreshCurrentUser()
                                await pickStatus.load()
                                restoring = false
                            }
                        } label: {
                            HStack {
                                Text("Restaurar compras")
                                Spacer()
                                if restoring { ProgressView() }
                            }
                        }
                        .disabled(restoring)
                    }
                } header: {
                    Text("Suscripción")
                } footer: {
                    if auth.currentUser?.isSubscribed != true {
                        Text("El acceso gratis muestra el portafolio y los últimos picks. Premium desbloquea la tesis completa de cada pick.")
                    }
                }

                Section {
                    NavigationLink {
                        InvestmentAmountView()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Monto por compra")
                                    .foregroundStyle(.primary)
                                Text("La misma cantidad cada vez")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(defaultInvestmentDisplay)
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("Cómo inviertes")
                } footer: {
                    Text("La misma cantidad en cada compra. Empieza con lo que no te pese y súbelo por etapas con el tiempo.")
                }

                Section {
                    NavigationLink {
                        PhilosophyView()
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Filosofía")
                                .foregroundStyle(.primary)
                            Text("Por qué invertimos así — dueño, largo plazo, dividendos")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("Vectorial")
                }

                Section {
                    NavigationLink {
                        PriorHoldingsView()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Posiciones anteriores")
                                    .foregroundStyle(.primary)
                                Text("Acciones que ya tenías antes de Vectorial")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }
                } header: {
                    Text("Portafolio")
                } footer: {
                    Text("Las sumamos a tu portafolio personal para que el precio promedio y el tamaño de tu posición reflejen tu realidad.")
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

                Section {
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        HStack {
                            Text("Eliminar cuenta")
                            Spacer()
                            if isDeleting { ProgressView() }
                        }
                    }
                    .disabled(isDeleting || isSigningOut)
                } footer: {
                    Text("Borra tu cuenta y todos tus datos de forma permanente. Esta acción no se puede deshacer. Si tienes una suscripción activa de App Store, cancélala por separado en Ajustes › tu nombre › Suscripciones.")
                }
            }
            .navigationTitle("Account")
            .manageSubscriptionsSheet(isPresented: $showManageSubs)
            .fullScreenCover(isPresented: $showTrial) {
                TrialActivationView {
                    showTrial = false
                    Task {
                        await auth.refreshCurrentUser()
                        await pickStatus.load()
                    }
                }
            }
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
            .confirmationDialog(
                "¿Eliminar tu cuenta?",
                isPresented: $showDeleteConfirm,
                titleVisibility: .visible
            ) {
                Button("Eliminar cuenta", role: .destructive) {
                    isDeleting = true
                    Task {
                        do {
                            await notifications.unregister()
                            try await auth.deleteAccount()
                        } catch {
                            deleteError = "No pudimos eliminar tu cuenta. Inténtalo de nuevo."
                        }
                        isDeleting = false
                    }
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Esto borra tu cuenta, tu portafolio y todos tus datos de forma permanente. No se puede deshacer.")
            }
            .alert("No se pudo eliminar", isPresented: .constant(deleteError != nil)) {
                Button("OK") { deleteError = nil }
            } message: {
                Text(deleteError ?? "")
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
        if user.isSubscribed { return String(localized: "Premium") }
        if user.subscriptionStatus == "canceled" { return String(localized: "Cancelada") }
        return String(localized: "Gratis")
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
