package com.tecnocell.Inventario.controller;

import com.tecnocell.Inventario.model.Movimiento;
import com.tecnocell.Inventario.service.MovimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService service;

    @GetMapping
    public List<Movimiento> listar() {
        return service.listarTodos();
    }

    @GetMapping("/entradas")
    public List<Movimiento> listarEntradas() {
        return service.listarPorTipo("ENTRADA");
    }

    @GetMapping("/salidas")
    public List<Movimiento> listarSalidas() {
        return service.listarPorTipo("SALIDA");
    }

    @GetMapping("/producto/{productoId}")
    public List<Movimiento> listarPorProducto(@PathVariable Long productoId) {
        return service.listarPorProducto(productoId);
    }

    @PostMapping("/entrada")
    public ResponseEntity<Movimiento> registrarEntrada(@Valid @RequestBody Movimiento movimiento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarEntrada(movimiento));
    }

    @PostMapping("/salida")
    public ResponseEntity<Movimiento> registrarSalida(@Valid @RequestBody Movimiento movimiento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarSalida(movimiento));
    }
}
