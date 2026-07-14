package com.tecnocell.Inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "proveedores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El RUC es obligatorio")
    @Column(unique = true, nullable = false, length = 11)
    private String ruc;

    @NotBlank(message = "La razon social es obligatoria")
    @Column(nullable = false, length = 200)
    private String empresa;

    @Column(length = 150)
    private String contacto;

    @Column(length = 15)
    private String tel;

    @Email(message = "Correo invalido")
    @Column(length = 150)
    private String email;

    @Column(length = 300)
    private String dir;

    private Boolean activo = true;
}
