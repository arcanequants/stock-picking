# kotlinx.serialization: keep generated serializers
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class **$$serializer { *; }
-keepclasseswithmembers,allowshrinking class * { @kotlinx.serialization.Serializable <fields>; }
-keep,includedescriptorclasses class com.vectorialdata.app.core.model.**$$serializer { *; }
-keepclassmembers class com.vectorialdata.app.core.model.** { *** Companion; }
-keepclasseswithmembers class com.vectorialdata.app.core.model.** { kotlinx.serialization.KSerializer serializer(...); }
