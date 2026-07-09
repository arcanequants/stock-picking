import SwiftUI

/// New-user onboarding: the philosophy + consistency education, the real
/// (blockchain-attested) track record, and the anatomy of a pick — then an
/// invite to start the free trial or sign in. Returning users tap "Iniciar
/// sesión" at any point. The same screens are reachable later from the
/// Filosofía section (see `PhilosophyView`).
struct OnboardingView: View {
    @State private var page = 0
    @State private var showAuth = false

    private let pageCount = 4

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                TabView(selection: $page) {
                    PhilosophyPage().tag(0)
                    ConsistencyPage().tag(1)
                    ProofPage().tag(2)
                    PickAnatomyPage().tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: page)

                bottomBar
            }
            .padding(.horizontal, 4)
        }
        .preferredColorScheme(.dark)
        .fullScreenCover(isPresented: $showAuth) {
            AuthView()
        }
    }

    private var topBar: some View {
        HStack {
            Button("Iniciar sesión") { showAuth = true }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.85))
            Spacer()
            if page < pageCount - 1 {
                Button("Saltar") { withAnimation { page = pageCount - 1 } }
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var bottomBar: some View {
        VStack(spacing: 14) {
            OnboardingDots(count: pageCount, index: page)

            if page < pageCount - 1 {
                Button {
                    withAnimation { page += 1 }
                } label: {
                    Text("Siguiente")
                        .primaryCTA()
                }
            } else {
                Button {
                    showAuth = true
                } label: {
                    Text("Empezar 14 días gratis")
                        .primaryCTA(emerald: true)
                }
                Text("$0.99/mes después · cancela cuando quieras")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }
}

// MARK: - Pages

private struct PhilosophyPage: View {
    var body: some View {
        OnboardingScaffold {
            OwlBadge()
            OnboardingTitle("Un regalo para\ntu yo del futuro.")
            OnboardingBody {
                Text("Invertir en las empresas más sólidas del mundo, a largo plazo. Cada una que sumas hoy trabaja para el tú de mañana — ")
                + Text("para que un día no dependas de nadie.").fontWeight(.semibold).foregroundColor(.white)
            }
        }
    }
}

private struct ConsistencyPage: View {
    var body: some View {
        OnboardingScaffold {
            OwlBadge()
            OnboardingTitle("No necesitas\nempezar con mucho.")
            OnboardingBody {
                Text("Solo con lo que ")
                + Text("no te pese").fontWeight(.semibold).foregroundColor(.white)
                + Text(" — esa cantidad que puedas poner pase lo que pase. La ")
                + Text("misma cada vez").fontWeight(.semibold).foregroundColor(.white)
                + Text(": si es $2, siempre $2. Nunca un día $10 y otro $50.")
            }
            Text("La constancia le gana al monto. Siempre.")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color("BrandEmerald"))
                .padding(.top, 4)
        }
    }
}

private struct PickAnatomyPage: View {
    private let rows: [(String, String)] = [
        ("building.2", "Qué hace la empresa"),
        ("target", "Por qué la elegimos"),
        ("exclamationmark.triangle", "El riesgo que vigilamos"),
        ("chart.bar", "Valuación y consenso")
    ]
    var body: some View {
        OnboardingScaffold {
            OwlBadge()
            OnboardingTitle("Así se ve\ncada pick.")
            OnboardingBody {
                Text("No son tips. Es la tesis completa — la entiendes en dos minutos, sin necesitar un MBA.")
            }
            VStack(spacing: 0) {
                ForEach(rows, id: \.1) { row in
                    HStack(spacing: 12) {
                        Image(systemName: row.0)
                            .foregroundStyle(Color("BrandEmerald"))
                            .frame(width: 24)
                        Text(row.1)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.92))
                        Spacer()
                    }
                    .padding(.vertical, 13)
                    if row.1 != rows.last?.1 {
                        Divider().overlay(Color.white.opacity(0.08))
                    }
                }
            }
            .padding(.horizontal, 16)
            .background(Color("CardBackground"))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .padding(.top, 6)
            Text("Te avisamos en la app cuando haya una compra que hacer.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
                .multilineTextAlignment(.center)
                .padding(.top, 8)
        }
    }
}

// MARK: - Proof (real data) — "El portafolio Vectorial" ★

private struct ProofRow: Identifiable {
    let ticker: String
    let pct: Double
    let days: Int
    var id: String { ticker }
}

private let lossColor = Color(red: 0.91, green: 0.54, blue: 0.42)

@MainActor
private final class ProofModel: ObservableObject {
    @Published var total: Double?
    @Published var rows: [ProofRow] = []
    @Published var count = 0
    @Published var spark: [Double] = []
    @Published var loaded = false

    func load() async {
        if let p = try? await APIClient.shared.get("/api/portfolio/positions", as: PortfolioPositions.self) {
            total = p.totalReturnPct
            count = p.positions.count
            let sorted = p.positions.sorted { $0.returnPct > $1.returnPct }
            var top = Array(sorted.prefix(3))
            if let worst = sorted.last, worst.returnPct < 0,
               !top.contains(where: { $0.ticker == worst.ticker }) {
                top.append(worst)   // always show a loss — that's the whole point
            }
            rows = top.map { ProofRow(ticker: $0.ticker, pct: $0.returnPct, days: $0.daysHeld) }
        }
        if let h = try? await APIClient.shared.get("/api/portfolio/history", as: [PortfolioHistoryPoint].self) {
            spark = h.map(\.returnPct)
        }
        loaded = true
    }
}

private struct ProofPage: View {
    @StateObject private var model = ProofModel()

    var body: some View {
        OnboardingScaffold {
            OnboardingTitle("El portafolio\nVectorial")
            Text("Historial real, sin edición.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.6))

            VStack(alignment: .leading, spacing: 12) {
                if let total = model.total {
                    Text("RENDIMIENTO TOTAL")
                        .font(.caption2.weight(.semibold))
                        .tracking(1)
                        .foregroundStyle(.white.opacity(0.45))
                    Text(PercentFormat.signed(total))
                        .font(.system(size: 34, weight: .bold, design: .rounded).monospacedDigit())
                        .foregroundStyle(total >= 0 ? Color("BrandEmerald") : lossColor)

                    Sparkline(values: model.spark)
                        .frame(height: 44)
                        .padding(.vertical, 4)

                    Divider().overlay(Color.white.opacity(0.08))

                    HStack {
                        Text("PICK").frame(maxWidth: .infinity, alignment: .leading)
                        Text("REND.").frame(width: 78, alignment: .trailing)
                        Text("DÍAS").frame(width: 44, alignment: .trailing)
                    }
                    .font(.system(size: 10, weight: .medium))
                    .tracking(0.5)
                    .foregroundStyle(.white.opacity(0.4))

                    ForEach(model.rows) { row in
                        HStack {
                            Text(row.ticker).frame(maxWidth: .infinity, alignment: .leading)
                                .foregroundStyle(.white.opacity(0.92))
                            Text(PercentFormat.signed(row.pct)).frame(width: 78, alignment: .trailing)
                                .foregroundStyle(row.pct >= 0 ? Color("BrandEmerald") : lossColor)
                            Text("\(row.days)").frame(width: 44, alignment: .trailing)
                                .foregroundStyle(.white.opacity(0.6))
                        }
                        .font(.system(.subheadline, design: .monospaced).monospacedDigit())
                    }

                    Text("\(model.count) posiciones · desde el inicio")
                        .font(.caption2).foregroundStyle(.white.opacity(0.4))
                        .padding(.top, 2)
                } else if model.loaded {
                    Text("Míralo tú mismo dentro de la app — el historial completo, posición por posición.")
                        .font(.subheadline).foregroundStyle(.white.opacity(0.75))
                } else {
                    ProgressView().tint(.white).frame(maxWidth: .infinity, minHeight: 120)
                }
            }
            .padding(16)
            .background(Color("CardBackground"))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            HStack(spacing: 8) {
                Image(systemName: "link")
                Text("Cada posición atestiguada en blockchain. No podemos reescribir la historia.")
            }
            .font(.footnote)
            .foregroundStyle(.white.opacity(0.55))
            .padding(.top, 4)
        }
        .task { await model.load() }
    }
}

private struct Sparkline: View {
    let values: [Double]
    var body: some View {
        GeometryReader { geo in
            if values.count > 1 {
                let minV = values.min() ?? 0
                let maxV = values.max() ?? 1
                let range = max(0.0001, maxV - minV)
                let pts = values.enumerated().map { i, v in
                    CGPoint(x: geo.size.width * CGFloat(i) / CGFloat(values.count - 1),
                            y: geo.size.height * (1 - CGFloat((v - minV) / range)))
                }
                Path { p in
                    p.move(to: pts[0])
                    for pt in pts.dropFirst() { p.addLine(to: pt) }
                }
                .stroke(
                    LinearGradient(colors: [Color(red: 0.20, green: 0.85, blue: 0.90), Color("BrandEmerald")],
                                   startPoint: .leading, endPoint: .trailing),
                    style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round)
                )
            }
        }
    }
}

// MARK: - Shared building blocks

private struct OnboardingScaffold<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Spacer(minLength: 12)
                    content
                    Spacer(minLength: 12)
                }
                .frame(maxWidth: .infinity, minHeight: proxy.size.height, alignment: .center)
                .padding(.horizontal, 20)
            }
        }
    }
}

private struct OwlBadge: View {
    var body: some View {
        Image("OwlMark")
            .resizable()
            .scaledToFit()
            .frame(width: 60, height: 60)
            .clipShape(Circle())
            .shadow(color: Color("BrandEmerald").opacity(0.5), radius: 18)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.bottom, 2)
    }
}

private struct OnboardingTitle: View {
    let text: String
    var small = false
    init(_ text: String, small: Bool = false) { self.text = text; self.small = small }
    var body: some View {
        Text(text)
            .font(small ? .title.bold() : .largeTitle.bold())
            .foregroundStyle(.white)
            .fixedSize(horizontal: false, vertical: true)
    }
}

private struct OnboardingBody<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        content
            .font(.body)
            .foregroundStyle(.white.opacity(0.7))
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
    }
}

private struct OnboardingDots: View {
    let count: Int
    let index: Int
    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Capsule()
                    .fill(i == index ? Color("BrandEmerald") : Color.white.opacity(0.18))
                    .frame(width: i == index ? 18 : 6, height: 6)
            }
        }
    }
}

private extension View {
    func primaryCTA(emerald: Bool = false) -> some View {
        self
            .font(.headline)
            .foregroundStyle(emerald ? Color.black : .white)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                Group {
                    if emerald {
                        LinearGradient(colors: [Color(red: 0.05, green: 0.64, blue: 0.44), Color("BrandEmerald")],
                                       startPoint: .leading, endPoint: .trailing)
                    } else {
                        LinearGradient(colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                                       startPoint: .leading, endPoint: .trailing)
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

enum PercentFormat {
    static func signed(_ pct: Double) -> String {
        let sign = pct >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.1f", pct))%"
    }
}

// MARK: - Philosophy (re-viewable later from Account)

/// The same education screens as onboarding, browsable any time from the
/// Account tab. No CTAs — pure "why we exist".
struct PhilosophyView: View {
    @State private var page = 0
    private let pageCount = 4

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            VStack(spacing: 0) {
                TabView(selection: $page) {
                    PhilosophyPage().tag(0)
                    ConsistencyPage().tag(1)
                    ProofPage().tag(2)
                    PickAnatomyPage().tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                OnboardingDots(count: pageCount, index: page)
                    .padding(.bottom, 16)
            }
        }
        .navigationTitle("Filosofía")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color("AppBackground"), for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}
