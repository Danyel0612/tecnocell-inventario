package com.tecnocell.Inventario.service;

import com.tecnocell.Inventario.model.Proveedor;
import com.tecnocell.Inventario.repository.ProveedorRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository repo;

    public List<Proveedor> listarActivos() {
        return repo.findByActivoTrue();
    }

    public Proveedor obtenerPorId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado con id: " + id));
    }

    public Proveedor crear(Proveedor proveedor) {
        if (repo.findByRuc(proveedor.getRuc()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un proveedor con el RUC: " + proveedor.getRuc());
        }
        if (proveedor.getActivo() == null) proveedor.setActivo(true);
        return repo.save(proveedor);
    }

    public Proveedor actualizar(Long id, Proveedor datos) {
        Proveedor existente = obtenerPorId(id);
        existente.setEmpresa(datos.getEmpresa());
        existente.setContacto(datos.getContacto());
        existente.setTel(datos.getTel());
        existente.setEmail(datos.getEmail());
        existente.setDir(datos.getDir());
        existente.setActivo(datos.getActivo());
        return repo.save(existente);
    }

    public void eliminar(Long id) {
        Proveedor p = obtenerPorId(id);
        p.setActivo(false);
        repo.save(p);
    }

    public List<Proveedor> buscarPorEmpresa(String empresa) {
        return repo.findByEmpresaContainingIgnoreCaseAndActivoTrue(empresa);
    }
}
