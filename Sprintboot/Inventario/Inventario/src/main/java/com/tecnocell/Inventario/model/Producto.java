package com.tecnocell.Inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El codigo es obligatorio")
    @Column(unique = true, nullable = false, length = 50)
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 100)
    private String categoria;

    @Column(length = 100)
    private String marca;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "stock_minimo")
    private Integer stockMinimo = 5;

    @Column(name = "p_costo")
    private Double pCosto = 0.0;

    @Column(name = "p_venta")
    private Double pVenta = 0.0;

    @Column(name = "fecha_registro")
    private LocalDate fechaRegistro = LocalDate.now();

    private Boolean activo = true;
}
