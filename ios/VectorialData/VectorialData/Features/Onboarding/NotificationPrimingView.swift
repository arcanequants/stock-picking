import SwiftUI

/// Soft-ask before the iOS system notification prompt. iOS never lets us enable
/// push by default — Apple requires the system permission dialog. Priming first
/// (explaining the value) meaningfully raises the opt-in rate vs a cold prompt.
struct NotificationPrimingView: View {
    @EnvironmentObject private var notifications: NotificationsManager
    var onDone: (() -> Void)?

    @State private var asking = false

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            VStack(spacing: 18) {
                Spacer()
                Image("OwlMark")
                    .resizable().scaledToFit()
                    .frame(width: 68, height: 68)
                    .clipShape(Circle())
                    .shadow(color: Color("BrandEmerald").opacity(0.5), radius: 20)

                Text("No te pierdas\nuna compra.")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                Text("Las oportunidades no avisan con tiempo. Deja que la app te avise en el momento justo — solo cuando hay algo que hacer, nunca spam.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)

                Spacer()

                Button {
                    asking = true
                    Task {
                        _ = await notifications.requestAuthorization()
                        asking = false
                        onDone?()
                    }
                } label: {
                    HStack {
                        if asking { ProgressView().tint(.black) }
                        else { Text("Activar avisos") }
                    }
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(
                        LinearGradient(colors: [Color(red: 0.05, green: 0.64, blue: 0.44), Color("BrandEmerald")],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(asking)

                Button("Ahora no") { onDone?() }
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.6))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .preferredColorScheme(.dark)
    }
}
