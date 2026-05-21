import SwiftUI

struct AllocationSection: View {
    let title: String
    let buckets: [AllocationBucket]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            VStack(spacing: 10) {
                ForEach(buckets) { bucket in
                    AllocationBar(
                        name: bucket.name,
                        count: bucket.count,
                        pct: bucket.pct,
                        color: color(for: bucket.name)
                    )
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func color(for name: String) -> Color {
        // Stable, readable palette keyed off the bucket name so the same
        // sector always gets the same color across loads.
        let palette: [Color] = [
            Color(red: 0.36, green: 0.83, blue: 0.64),  // emerald
            Color(red: 0.47, green: 0.53, blue: 0.96),  // indigo
            Color(red: 0.67, green: 0.51, blue: 0.95),  // violet
            Color(red: 0.94, green: 0.52, blue: 0.49),  // coral
            Color(red: 0.98, green: 0.75, blue: 0.36),  // amber
            Color(red: 0.40, green: 0.78, blue: 0.85),  // cyan
            Color(red: 0.96, green: 0.48, blue: 0.68),  // pink
            Color(red: 0.55, green: 0.85, blue: 0.42),  // lime
        ]
        let hash = abs(name.hashValue)
        return palette[hash % palette.count]
    }
}

private struct AllocationBar: View {
    let name: String
    let count: Int
    let pct: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(name)
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
                Spacer()
                Text("\(Int(pct))% · \(count)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.55))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.06))
                        .frame(height: 6)
                    Capsule()
                        .fill(color)
                        .frame(width: geo.size.width * CGFloat(pct / 100), height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}
