package com.vectorialdata.app.feature.picks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.model.PickStatus
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Records (or edits) a buy — mirror of iOS `PickBuySheet`. The "$" prefix
 * on the monto field is the ONLY place the user sees a dollar sign for
 * input: it's their own money, never a model price.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PickBuySheet(pick: Pick, onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val defaultInvestment by PickStatusStore.defaultInvestment.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    val editing = pick.status == PickStatus.BOUGHT
    var priceText by remember {
        mutableStateOf(Formatters.moneyTrim(pick.buyPrice ?: pick.priceAtPick))
    }
    var amountText by remember {
        mutableStateOf(Formatters.moneyTrim(pick.amountInvested ?: defaultInvestment ?: 50.0))
    }
    var saveAsDefault by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }

    val defaultIsSet = defaultInvestment != null

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.background,
    ) {
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                if (editing) "Editar tu compra de ${pick.ticker}" else "Marcaste ${pick.ticker}",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "Pick #${pick.pickNumber} · ${pick.date}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            OutlinedTextField(
                value = priceText,
                onValueChange = { priceText = it },
                label = { Text("Precio al que compraste") },
                supportingText = { Text("Pre-llenado con el precio del momento del pick") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it },
                label = { Text("Cuánto invertiste") },
                prefix = { Text("$") },
                supportingText = {
                    Text(
                        if (defaultIsSet) "Tu default — puedes cambiarlo"
                        else "Si pones la misma cantidad cada vez, guárdala abajo",
                    )
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
            )

            if (!defaultIsSet) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Switch(checked = saveAsDefault, onCheckedChange = { saveAsDefault = it })
                    Text(
                        "Recordar $$amountText como mi monto por pick",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            errorText?.let {
                Text(it, fontSize = 13.sp, color = MaterialTheme.colorScheme.error)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                ) { Text("Cancelar") }

                Button(
                    onClick = {
                        val price = parseDouble(priceText)
                        val amount = parseDouble(amountText)
                        when {
                            price == null || price <= 0 -> errorText = "Precio inválido."
                            amount == null || amount <= 0 -> errorText = "Monto inválido."
                            else -> scope.launch {
                                submitting = true
                                errorText = null
                                val ok = PickStatusStore.markBought(
                                    pickNumber = pick.pickNumber,
                                    buyPrice = price,
                                    amount = amount,
                                    saveAsDefault = !defaultIsSet && saveAsDefault,
                                )
                                submitting = false
                                if (ok) {
                                    delay(250)
                                    onSuccess()
                                } else {
                                    errorText = "No se pudo guardar."
                                }
                            }
                        }
                    },
                    enabled = !submitting,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandEmerald,
                        contentColor = Color(0xFF05080A),
                    ),
                ) { Text("Confirmar", fontWeight = FontWeight.SemiBold) }
            }
        }
    }
}

/** Comma-tolerant decimal parsing, mirror of the iOS `parseDouble`. */
private fun parseDouble(text: String): Double? =
    text.trim().replace(",", ".").toDoubleOrNull()
