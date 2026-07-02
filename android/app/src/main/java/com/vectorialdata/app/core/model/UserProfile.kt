package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable

/**
 * Matches `GET /api/me`. The snake_case JSON naming strategy maps
 * `is_subscribed` -> [isSubscribed], etc. — mirror of iOS `UserProfile`.
 */
@Serializable
data class UserProfile(
    val email: String,
    val isSubscribed: Boolean = false,
    val subscriptionStatus: String? = null,
    val deliveryChannel: String? = null,
    val locale: String? = null,
    val createdAt: String? = null,
    val currentPeriodEnd: String? = null,
)
