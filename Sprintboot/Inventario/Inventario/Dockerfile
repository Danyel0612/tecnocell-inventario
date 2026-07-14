# ─────────────────────────────────────────────────────────────
# TecnoCell Inventario — Dockerfile (Multi-stage build)
# ─────────────────────────────────────────────────────────────
# Etapa 1: Compilar con Maven + JDK 21
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copiar descriptor de dependencias primero (cache layer)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -q

# Copiar codigo fuente y compilar
COPY src src
RUN ./mvnw clean package -DskipTests -q

# ─────────────────────────────────────────────────────────────
# Etapa 2: Imagen de produccion ligera (solo JRE)
FROM eclipse-temurin:21-jre

WORKDIR /app

# Metadatos de la imagen
LABEL maintainer="TecnoCell S.A.C."
LABEL description="Sistema de Gestion de Inventario TecnoCell"
LABEL version="1.0.0"

# Copiar el JAR desde la etapa de build
COPY --from=builder /app/target/*.jar app.jar

# Puerto expuesto
EXPOSE 8080

# Variables de entorno (se pueden sobreescribir al ejecutar el contenedor)
ENV DB_URL=jdbc:postgresql://aws-0-us-west-2.pooler.supabase.com:5432/postgres
ENV DB_USER=postgres.cilnbzovlcarnjkiuylh
ENV DB_PASS=cambiar_en_produccion
ENV JWT_SECRET=TecnoCellS3cretK3y2024SuperSeguroParaJWT

# Comando de arranque con configuracion de memoria optimizada
ENTRYPOINT ["java", \
  "-Xmx512m", \
  "-Xms256m", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
