package com.tecnocell.Inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;


@Entity
@Table(name = "movimientos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (fecha == null) fecha = LocalDate.now();
    }

    // "ENTRADA" o "SALIDA" – lo setea el Service, no el usuario
    @Column(nullable = false, length = 10)
    private String tipo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @Column(length = 100)
    private String motivo;

    @Column(name = "p_costo")
    private Double pCosto;

    @Column(name = "p_venta")
    private Double pVenta;

    @Column(length = 500)
    private String obs;

    // Solo para SALIDAS
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Solo para ENTRADAS
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(length = 100)
    private String usuario;
}
