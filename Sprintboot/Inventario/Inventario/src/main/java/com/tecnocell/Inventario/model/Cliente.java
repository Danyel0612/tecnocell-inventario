package com.tecnocell.Inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El documento es obligatorio")
    @Column(unique = true, nullable = false, length = 11)
    private String doc;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 15)
    private String tel;

    @Email(message = "Correo invalido")
    @Column(length = 150)
    private String email;

    @Column(length = 300)
    private String dir;

    private Boolean activo = true;
}
