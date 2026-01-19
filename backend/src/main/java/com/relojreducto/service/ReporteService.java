package com.relojreducto.service;

import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ReporteService {

    private final UsuarioRepository usuarioRepository;

    public ReporteService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public ByteArrayInputStream exportarUsuariosExcel() throws IOException {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return generateExcel(usuarios);
    }

    public ByteArrayInputStream exportarUsuariosExcelBySucursal(Long sucursalId) throws IOException {
        List<Usuario> usuarios = usuarioRepository.findBySucursal_Id(sucursalId);
        return generateExcel(usuarios);
    }

    private ByteArrayInputStream generateExcel(List<Usuario> usuarios) throws IOException {
        String[] columns = { "ID", "Cédula", "Nombre", "Rol", "Email", "Teléfono", "Salario", "Estado" };

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Colaboradores");

            // Estilo para el header
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Row for Header
            Row headerRow = sheet.createRow(0);

            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            for (Usuario usuario : usuarios) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(usuario.getId());
                row.createCell(1).setCellValue(usuario.getUsername());
                row.createCell(2).setCellValue(usuario.getNombreCompleto());
                row.createCell(3).setCellValue(usuario.getRol().name());
                row.createCell(4).setCellValue(usuario.getEmail() != null ? usuario.getEmail() : "");
                row.createCell(5).setCellValue(usuario.getTelefono() != null ? usuario.getTelefono() : "");
                row.createCell(6).setCellValue(
                        usuario.getSalarioMensual() != null ? usuario.getSalarioMensual().doubleValue() : 0);
                row.createCell(7).setCellValue(usuario.getActivo() ? "ACTIVO" : "INACTIVO");
            }

            // Autosize columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
