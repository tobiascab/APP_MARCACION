#!/bin/bash
# ===================================================================
# Script de Backup Automático para RelojReducto
# Genera backup de la base de datos MySQL y lo comprime.
# Se puede programar con cron para ejecución diaria.
# 
# Uso manual: bash backup.sh
# Cron (diario a las 2AM): 0 2 * * * /ruta/a/backup.sh
# ===================================================================

# Configuración
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="relojreducto"
DB_USER="root"
DB_PASS=""  # Dejar vacío si no tiene contraseña, o configurar

# Directorio de backups
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="$BACKUP_DIR/relojreducto_backup_$DATE.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Retención: eliminar backups mayores a 30 días
RETENTION_DAYS=30

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

echo "==================================="
echo "  RelojReducto - Backup Automático"
echo "  Fecha: $(date)"
echo "==================================="

# Verificar que mysqldump esté disponible
if ! command -v mysqldump &> /dev/null; then
    echo "❌ ERROR: mysqldump no encontrado. Instalar mysql-client."
    exit 1
fi

# Ejecutar backup
echo "📦 Generando backup de la base de datos '$DB_NAME'..."
if [ -z "$DB_PASS" ]; then
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" --single-transaction --routines --triggers > "$BACKUP_FILE" 2>/dev/null
else
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" --single-transaction --routines --triggers > "$BACKUP_FILE" 2>/dev/null
fi

# Verificar resultado
if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    # Comprimir
    gzip "$BACKUP_FILE"
    SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo "✅ Backup exitoso: $COMPRESSED_FILE ($SIZE)"
    
    # Limpieza de backups antiguos
    echo "🧹 Eliminando backups mayores a $RETENTION_DAYS días..."
    DELETED=$(find "$BACKUP_DIR" -name "relojreducto_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    echo "   Eliminados: $DELETED archivo(s) antiguo(s)"
    
    # Listar backups actuales
    echo ""
    echo "📋 Backups disponibles:"
    ls -lh "$BACKUP_DIR"/relojreducto_backup_*.sql.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
    TOTAL=$(ls "$BACKUP_DIR"/relojreducto_backup_*.sql.gz 2>/dev/null | wc -l)
    echo "   Total: $TOTAL backup(s)"
else
    echo "❌ ERROR: El backup falló o el archivo está vacío."
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo ""
echo "✅ Proceso completado."
