import SwiftUI

// One-shot owl reveal animation for the launch splash. Ported from the
// Vectorial Data Terminal app. Plays ONCE when the view appears, then settles
// into a static glowing owl (the timeline stops ticking so it doesn't burn
// battery). Three styles; the app uses `.particles` by default.

enum OwlRevealStyle: String, CaseIterable, Identifiable {
    case matrix       // green code-rain dissolving into the owl
    case particles    // owl materializes from converging particles + bloom
    case holographic  // ambient lights + neon ring trace + scanline sweep

    var id: String { rawValue }
    var duration: Double {
        switch self {
        case .matrix: return 2.0
        case .particles: return 1.8
        case .holographic: return 2.2
        }
    }
}

struct OwlReveal: View {
    let style: OwlRevealStyle
    var size: CGFloat = 150
    var onFinished: (() -> Void)?

    @State private var start = Date()
    @State private var done = false

    private static let brandGreen = Color(red: 0.30, green: 0.95, blue: 0.55)
    private static let brandTeal = Color(red: 0.20, green: 0.85, blue: 0.90)

    var body: some View {
        ZStack {
            if done {
                settledOwl
            } else {
                TimelineView(.animation) { timeline in
                    let t = min(1, max(0, timeline.date.timeIntervalSince(start) / style.duration))
                    content(progress: t)
                }
            }
        }
        .onAppear {
            start = Date()
            done = false
            DispatchQueue.main.asyncAfter(deadline: .now() + style.duration) {
                done = true
                onFinished?()
            }
        }
    }

    private var settledOwl: some View {
        owlImage
            .shadow(color: Self.brandGreen.opacity(0.55), radius: 24)
            .shadow(color: Self.brandTeal.opacity(0.35), radius: 48)
    }

    private var owlImage: some View {
        Image("OwlMark")
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(width: size, height: size)
            .clipShape(Circle())
    }

    @ViewBuilder
    private func content(progress t: Double) -> some View {
        switch style {
        case .matrix: matrixBody(t)
        case .particles: particlesBody(t)
        case .holographic: holographicBody(t)
        }
    }

    // MARK: - A. Matrix rain → owl

    private func matrixBody(_ t: Double) -> some View {
        let rainAlpha = 1 - smooth(t, 0.45, 0.95)
        let owlIn = smooth(t, 0.40, 0.85)
        let scan = scanlineY(t, lead: 0.35)
        return ZStack {
            Canvas { ctx, sz in
                drawMatrixRain(ctx, sz, t: t, alpha: rainAlpha)
            }
            .frame(width: size * 1.9, height: size * 1.9)
            .mask(Circle().frame(width: size * 1.7, height: size * 1.7))

            owlImage
                .opacity(owlIn)
                .scaleEffect(0.86 + 0.14 * owlIn)
                .blur(radius: 14 * (1 - owlIn))
                .shadow(color: Self.brandGreen.opacity(0.6 * owlIn), radius: 26)

            if let y = scan {
                Rectangle()
                    .fill(LinearGradient(
                        colors: [.clear, Self.brandGreen.opacity(0.9), .clear],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: size * 1.4, height: 3)
                    .blur(radius: 2)
                    .offset(y: y * size * 0.85)
                    .opacity(rainAlpha)
            }
        }
    }

    private func drawMatrixRain(_ ctx: GraphicsContext, _ sz: CGSize, t: Double, alpha: Double) {
        guard alpha > 0.01 else { return }
        let cols = 16
        let colW = sz.width / CGFloat(cols)
        let glyphs = "01ｱｲｳｴｵｶｷｸ▚▞◢◣ΞΛ".map { String($0) }
        for c in 0..<cols {
            var rng = SeededRNG(seed: UInt64(c) &* 2654435761)
            let speed = 0.6 + rng.unit() * 0.9
            let head = (t * speed * 2.2).truncatingRemainder(dividingBy: 1.4) * sz.height
            let len = 6 + Int(rng.unit() * 6)
            for r in 0..<len {
                let y = head - CGFloat(r) * (colW * 1.25)
                guard y > -colW, y < sz.height + colW else { continue }
                let fade = (1 - Double(r) / Double(len))
                let gi = (c * 7 + r * 3 + Int(t * 14)) % glyphs.count
                let isHead = r == 0
                let color = isHead ? Color.white : Self.brandGreen
                var text = Text(glyphs[gi])
                    .font(.system(size: colW * 0.9, weight: .medium, design: .monospaced))
                text = text.foregroundColor(color.opacity(alpha * fade * (isHead ? 1 : 0.85)))
                ctx.draw(text, at: CGPoint(x: CGFloat(c) * colW + colW / 2, y: y))
            }
        }
    }

    // MARK: - B. Particle materialization

    private func particlesBody(_ t: Double) -> some View {
        let owlIn = smooth(t, 0.45, 0.95)
        let bloom = bell(t, peak: 0.7, width: 0.35)
        return ZStack {
            Circle()
                .fill(RadialGradient(
                    colors: [Self.brandTeal.opacity(0.35 * (0.4 + bloom)), .clear],
                    center: .center, startRadius: 0, endRadius: size))
                .frame(width: size * 2.4, height: size * 2.4)
                .blur(radius: 30)

            Canvas { ctx, sz in
                drawParticles(ctx, sz, t: t)
            }
            .frame(width: size * 2.2, height: size * 2.2)

            owlImage
                .opacity(owlIn)
                .scaleEffect(0.7 + 0.3 * easeOut(owlIn))
                .blur(radius: 10 * (1 - owlIn))
                .shadow(color: Self.brandGreen.opacity(0.7 * owlIn), radius: 22 + 18 * bloom)
                .shadow(color: Self.brandTeal.opacity(0.5 * owlIn), radius: 40 * bloom)
        }
    }

    private func drawParticles(_ ctx: GraphicsContext, _ sz: CGSize, t: Double) {
        let center = CGPoint(x: sz.width / 2, y: sz.height / 2)
        let count = 90
        let conv = easeInOut(smooth(t, 0.0, 0.85))
        let fade = 1 - smooth(t, 0.65, 1.0)
        guard fade > 0.01 else { return }
        for i in 0..<count {
            var rng = SeededRNG(seed: UInt64(i) &* 0x9E3779B1)
            let ang = rng.unit() * 2 * .pi
            let dist = (0.55 + rng.unit() * 0.45) * sz.width / 2
            let ox = center.x + cos(ang) * dist
            let oy = center.y + sin(ang) * dist
            let tAng = rng.unit() * 2 * .pi
            let tRad = (0.18 + rng.unit() * 0.20) * size
            let tx = center.x + cos(tAng) * tRad
            let ty = center.y + sin(tAng) * tRad
            let x = ox + (tx - ox) * conv
            let y = oy + (ty - oy) * conv
            let r = (1.1 + rng.unit() * 1.8)
            let warm = rng.unit()
            let col = (warm > 0.5 ? Self.brandGreen : Self.brandTeal)
            let rect = CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)
            ctx.fill(Circle().path(in: rect), with: .color(col.opacity(fade * (0.5 + 0.5 * conv))))
        }
    }

    // MARK: - C. Holographic + ambient lights + ring trace

    private func holographicBody(_ t: Double) -> some View {
        let ringTrim = easeOut(smooth(t, 0.10, 0.70))
        let owlIn = smooth(t, 0.35, 0.85)
        let scan = scanlineY(t, lead: 0.30)
        let flicker = owlIn < 1 ? (0.7 + 0.3 * sin(t * 60)) : 1
        return ZStack {
            AmbientLights(progress: t)
                .frame(width: size * 3.0, height: size * 3.0)

            Circle()
                .trim(from: 0, to: ringTrim)
                .stroke(
                    AngularGradient(colors: [Self.brandTeal, Self.brandGreen, Self.brandTeal],
                                    center: .center),
                    style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: size * 1.18, height: size * 1.18)
                .shadow(color: Self.brandGreen.opacity(0.8), radius: 8)

            owlImage
                .opacity(owlIn * flicker)
                .scaleEffect(0.92 + 0.08 * owlIn)
                .shadow(color: Self.brandTeal.opacity(0.6 * owlIn), radius: 24)
                .overlay {
                    if let y = scan {
                        Rectangle()
                            .fill(LinearGradient(colors: [.clear, .white.opacity(0.85), .clear],
                                                 startPoint: .top, endPoint: .bottom))
                            .frame(height: 2.5)
                            .offset(y: (y - 0.5) * size)
                            .blendMode(.screen)
                    }
                }
                .mask(Circle().frame(width: size, height: size))
        }
    }

    // MARK: - Easing / helpers

    private func smooth(_ x: Double, _ a: Double, _ b: Double) -> Double {
        guard b > a else { return x >= b ? 1 : 0 }
        let u = min(1, max(0, (x - a) / (b - a)))
        return u * u * (3 - 2 * u)
    }
    private func easeOut(_ x: Double) -> Double { 1 - pow(1 - x, 3) }
    private func easeInOut(_ x: Double) -> Double { x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2 }
    private func bell(_ x: Double, peak: Double, width: Double) -> Double {
        exp(-pow((x - peak) / width, 2))
    }
    private func scanlineY(_ t: Double, lead: Double) -> Double? {
        let s = (t - lead) / (1 - lead)
        guard s >= 0, s <= 1 else { return nil }
        return s
    }
}

// Drifting blurred radial "lights" behind the owl. Subtle one-pass pulse.
struct AmbientLights: View {
    var progress: Double
    var body: some View {
        let p = progress
        ZStack {
            light(Color(red: 0.20, green: 0.85, blue: 0.90), dx: -0.22, dy: -0.18, phase: 0.0, p: p)
            light(Color(red: 0.30, green: 0.95, blue: 0.55), dx: 0.24, dy: 0.16, phase: 0.5, p: p)
            light(Color(red: 0.15, green: 0.35, blue: 0.95), dx: 0.10, dy: -0.26, phase: 0.8, p: p)
        }
    }
    private func light(_ c: Color, dx: CGFloat, dy: CGFloat, phase: Double, p: Double) -> some View {
        let pulse = 0.35 + 0.65 * (0.5 + 0.5 * sin((p * 2 + phase) * .pi))
        return Circle()
            .fill(RadialGradient(colors: [c.opacity(0.45 * pulse), .clear],
                                 center: .center, startRadius: 0, endRadius: 120))
            .frame(width: 240, height: 240)
            .blur(radius: 40)
            .offset(x: dx * 300, y: dy * 300)
    }
}

// Tiny deterministic RNG so particle/rain layouts are stable across frames.
struct SeededRNG {
    private var state: UInt64
    init(seed: UInt64) { state = seed == 0 ? 0xDEADBEEF : seed }
    mutating func next() -> UInt64 {
        state ^= state << 13; state ^= state >> 7; state ^= state << 17
        return state
    }
    mutating func unit() -> Double { Double(next() % 10_000) / 10_000.0 }
}
