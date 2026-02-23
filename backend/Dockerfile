# ==========================================
# Stage 1: Build con Maven (cache de dependencias)
# ==========================================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# 1) Copiar solo pom.xml y descargar deps (capa cacheada si pom.xml no cambia)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2) Copiar código fuente y compilar (solo esta capa se rehace en cambios de código)
COPY src ./src
RUN mvn package -DskipTests -B

# ==========================================
# Stage 2: Runtime liviano (Alpine JRE)
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Timezone
ENV TZ=America/Asuncion
RUN apk add --no-cache tzdata curl && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Copiar solo el JAR compilado
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD curl -s http://localhost:8080/api/auth/login -o /dev/null -w '%{http_code}' | grep -qE '(200|401|403|405|500)' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
