package com.tecnocell.Inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El username es obligatorio")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    @Column(nullable = false, length = 255)
    private String password;

    @NotBlank(message = "El nombre completo es obligatorio")
    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 20)
    private String rol = "Vendedor";

    @Column(length = 8)
    private String dni;

    @Email(message = "Correo invalido")
    @Column(length = 150)
    private String email;

    @Column(length = 15)
    private String tel;

    private Boolean activo = true;
}
