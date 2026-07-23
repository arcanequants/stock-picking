import SwiftUI

/// Game-style first-run coach marks: the screen dims, ONE element lights up
/// with a one-sentence tooltip, tap anywhere advances. 4 steps, ~15 seconds,
/// always skippable. Shown once after first-run setup; replayable from
/// Cuenta → "Ver tutorial".
struct CoachTourView: View {
    /// Called with the tab the tour wants visible behind the overlay.
    var onSelectTab: (AppTab) -> Void
    var onFinished: () -> Void
    /// Global frame of the first pending pick card, reported by PicksView via
    /// `.coachTarget(...)` — free accounts have an upsell banner above the
    /// list, so the card's position can't be approximated.
    var firstCardFrame: CGRect?

    @State private var step = 0

    private struct Step {
        let icon: String
        let title: LocalizedStringKey
        let message: LocalizedStringKey
        let target: Target
        let tab: AppTab?          // switch the visible tab when entering
        enum Target { case tabItem(Int), contentCard }
    }

    private let steps: [Step] = [
        Step(icon: "📥",
             title: "Aquí llegan tus picks",
             message: "Cuando haya una compra que valga la pena, te avisamos y aparece en Elecciones.",
             target: .tabItem(2), tab: .home),
        Step(icon: "🏦",
             title: "Compra en tu broker, márcala aquí",
             message: "La compra la haces en tu broker. Luego tócala aquí y la marcas — así seguimos tu portafolio real.",
             target: .contentCard, tab: .picks),
        Step(icon: "📈",
             title: "Tu portafolio, en vivo",
             message: "El historial completo de Vectorial y el tuyo con lo que has comprado — solo porcentajes, sin humo.",
             target: .tabItem(1), tab: .portfolio),
        Step(icon: "⚙️",
             title: "Tu monto y tu plan",
             message: "Cambia tu monto por compra, repasa la filosofía y maneja tu suscripción.",
             target: .tabItem(3), tab: .account),
    ]

    var body: some View {
        GeometryReader { geo in
            let rect = spotlightRect(for: steps[step].target, in: geo)
            ZStack {
                // Dim everything except the spotlight cutout. ignoresSafeArea
                // expands this layer to the physical screen, shifting its
                // coordinate origin above the geo space the ring uses — offset
                // the cutout by the insets or the hole lands ~62pt higher than
                // the ring (visible as a bright band over whatever sits there).
                SpotlightMask(
                    cutout: rect.offsetBy(dx: geo.safeAreaInsets.leading,
                                          dy: geo.safeAreaInsets.top),
                    corner: 14
                )
                    .fill(Color.black.opacity(0.72), style: FillStyle(eoFill: true))
                    .ignoresSafeArea()

                // Glow ring around the highlighted element.
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color("BrandEmerald"), lineWidth: 3)
                    .shadow(color: Color("BrandEmerald").opacity(0.65), radius: 14)
                    .frame(width: rect.width, height: rect.height)
                    .position(x: rect.midX, y: rect.midY)

                tooltip(for: steps[step], near: rect, in: geo)

                // Skip — always visible, top right.
                VStack {
                    HStack {
                        Spacer()
                        Button("Saltar") { onFinished() }
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                            .padding(.trailing, 20)
                            .padding(.top, 8)
                    }
                    Spacer()
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { advance() }
            .animation(.spring(duration: 0.4), value: step)
        }
        .transition(.opacity)
        // Replay can start from any tab — force the one step 1 talks about.
        .onAppear { if let tab = steps[0].tab { onSelectTab(tab) } }
    }

    private func advance() {
        if step < steps.count - 1 {
            step += 1
            if let tab = steps[step].tab { onSelectTab(tab) }
        } else {
            onFinished()
        }
    }

    // MARK: - Geometry

    /// Approximate frames in the overlay's local space (origin at the top
    /// safe edge), tuned against accessibility frames on the iOS 26 floating
    /// tab bar (iPhone 17 Pro: tab items at screen y 795–849, centers at
    /// 72.5 + 85.7·i on a 402pt-wide screen; first pick card at y 219).
    private func spotlightRect(for target: Step.Target, in geo: GeometryProxy) -> CGRect {
        let w = geo.size.width
        switch target {
        case .tabItem(let i):
            // Item centers sit symmetrically inset ~18% from each edge; the
            // bar hugs the bottom safe edge, so anchor to the local bottom.
            let edge = w * 0.18
            let centerX = edge + (w - edge * 2) * CGFloat(i) / 3
            return CGRect(x: centerX - 40,
                          y: geo.size.height - 45,
                          width: 80, height: 54)
        case .contentCard:
            // Prefer the real card frame reported by PicksView (free accounts
            // have an upsell banner above the list that shifts it down).
            if let global = firstCardFrame, !global.isEmpty {
                let origin = geo.frame(in: .global).origin
                return global
                    .offsetBy(dx: -origin.x, dy: -origin.y)
                    .insetBy(dx: -4, dy: -4)
            }
            // Fallback: first card right below the large-title header.
            return CGRect(x: 15, y: 155, width: w - 30, height: 88)
        }
    }

    @ViewBuilder
    private func tooltip(for s: Step, near rect: CGRect, in geo: GeometryProxy) -> some View {
        let above = rect.midY > geo.size.height * 0.55
        let tipWidth: CGFloat = min(258, geo.size.width - 36)
        VStack(alignment: .leading, spacing: 4) {
            // Icon outside the title Text so a wrapping title stays aligned
            // under its own first word, not under the emoji.
            HStack(alignment: .firstTextBaseline, spacing: 7) {
                Text(s.icon)
                Text(s.title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text(s.message)
                .font(.footnote)
                .foregroundStyle(Color(red: 0.79, green: 0.84, blue: 0.81))
                .fixedSize(horizontal: false, vertical: true)
            HStack {
                Text("\(step + 1) de \(steps.count)")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.55))
                Spacer()
                Text(step == steps.count - 1 ? "¡Listo!" : "Siguiente")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 6)
                    .background(Color("BrandEmerald"))
                    .clipShape(Capsule())
            }
            .padding(.top, 6)
        }
        .padding(14)
        .frame(width: tipWidth, alignment: .leading)
        .background(Color(red: 0.055, green: 0.10, blue: 0.086))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color("BrandEmerald").opacity(0.45), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.5), radius: 16)
        .position(
            x: min(max(tipWidth / 2 + 16, rect.midX), geo.size.width - tipWidth / 2 - 16),
            y: above ? rect.minY - 86 : rect.maxY + 96
        )
    }
}

/// Views the coach tour spotlights report their global frame under a string
/// id; MainTabView collects them and hands them to CoachTourView.
struct CoachTargetKey: PreferenceKey {
    static let defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue()) { $1 }
    }
}

extension View {
    /// Report this view's global frame as a coach-tour target.
    @ViewBuilder
    func coachTarget(_ id: String, active: Bool = true) -> some View {
        if active {
            background(
                GeometryReader { g in
                    Color.clear.preference(key: CoachTargetKey.self,
                                           value: [id: g.frame(in: .global)])
                }
            )
        } else {
            self
        }
    }
}

/// Full-screen rect with a rounded-rect hole (even-odd fill).
private struct SpotlightMask: Shape {
    var cutout: CGRect
    var corner: CGFloat

    var animatableData: CGRect.AnimatableData {
        get { cutout.animatableData }
        set { cutout.animatableData = newValue }
    }

    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addRect(rect)
        p.addRoundedRect(in: cutout, cornerSize: CGSize(width: corner, height: corner))
        return p
    }
}

extension CGRect {
    var animatableData: AnimatablePair<AnimatablePair<CGFloat, CGFloat>, AnimatablePair<CGFloat, CGFloat>> {
        get { AnimatablePair(AnimatablePair(origin.x, origin.y), AnimatablePair(size.width, size.height)) }
        set {
            origin.x = newValue.first.first; origin.y = newValue.first.second
            size.width = newValue.second.first; size.height = newValue.second.second
        }
    }
}
