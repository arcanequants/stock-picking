import Foundation

/// Minimal async/await HTTP client for the Vectorial Data backend.
/// Handles JSON encoding/decoding and optional bearer auth.
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private var bearerToken: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    func setBearer(_ token: String) { bearerToken = token }
    func clearBearer() { bearerToken = nil }

    func get<T: Decodable>(_ path: String, as _: T.Type) async throws -> T {
        try await request(path: path, method: "GET", body: Optional<Never>.none, as: T.self)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B, as _: T.Type) async throws -> T {
        try await request(path: path, method: "POST", body: body, as: T.self)
    }

    func delete<B: Encodable, T: Decodable>(_ path: String, body: B, as _: T.Type) async throws -> T {
        try await request(path: path, method: "DELETE", body: body, as: T.self)
    }

    private func request<B: Encodable, T: Decodable>(
        path: String,
        method: String,
        body: B?,
        as _: T.Type
    ) async throws -> T {
        guard let url = URL(string: path, relativeTo: AppConfig.apiBaseURL) else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = bearerToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }

        switch http.statusCode {
        case 200..<300:
            if T.self == EmptyResponse.self {
                return EmptyResponse() as! T
            }
            return try decoder.decode(T.self, from: data)
        case 401:
            throw APIError.unauthorized
        case 429:
            throw APIError.rateLimited
        default:
            throw APIError.server(status: http.statusCode, data: data)
        }
    }
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case rateLimited
    case server(status: Int, data: Data)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid response"
        case .unauthorized: return "Please sign in again"
        case .rateLimited: return "Too many requests — try again in a moment"
        case .server(let status, _): return "Server error (\(status))"
        }
    }
}
