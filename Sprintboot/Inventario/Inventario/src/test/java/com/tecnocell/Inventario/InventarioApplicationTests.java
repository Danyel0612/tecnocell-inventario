package com.tecnocell.Inventario;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocell.Inventario.model.Cliente;
import com.tecnocell.Inventario.model.Producto;
import com.tecnocell.Inventario.service.ClienteService;
import com.tecnocell.Inventario.service.ProductoService;
import com.tecnocell.Inventario.service.UsuarioService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pruebas funcionales de integracion para TecnoCell Inventario.
 * Validan los flujos criticos contra la base de datos real (Supabase).
 *
 * Para ejecutar:  mvn test
 */
@SpringBootTest
class InventarioApplicationTests {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private ObjectMapper objectMapper;

    // ── TEST 1: Contexto de Spring carga correctamente ─────────────────────
    @Test
    @DisplayName("T01 - El contexto de Spring Boot se carga sin errores")
    void contextLoads() {
        assertThat(usuarioService).isNotNull();
        assertThat(productoService).isNotNull();
        assertThat(clienteService).isNotNull();
    }

    // ── TEST 2: Login valido devuelve usuario ──────────────────────────────
    @Test
    @DisplayName("T02 - Login con credenciales correctas retorna usuario")
    void testLoginValido() {
        Optional<?> usuario = usuarioService.login("admin", "1234");
        assertThat(usuario).isPresent();
    }

    // ── TEST 3: Login con password incorrecto devuelve vacio ───────────────
    @Test
    @DisplayName("T03 - Login con contrasena incorrecta retorna Optional vacio")
    void testLoginInvalido() {
        Optional<?> usuario = usuarioService.login("admin", "passwordIncorrecto123");
        assertThat(usuario).isEmpty();
    }

    // ── TEST 4: Login con usuario inexistente devuelve vacio ───────────────
    @Test
    @DisplayName("T04 - Login con usuario inexistente retorna Optional vacio")
    void testLoginUsuarioInexistente() {
        Optional<?> usuario = usuarioService.login("usuario_que_no_existe", "1234");
        assertThat(usuario).isEmpty();
    }

    // ── TEST 5: Listar productos activos retorna lista ─────────────────────
    @Test
    @DisplayName("T05 - listarActivos() retorna lista de productos")
    void testListarProductosActivos() {
        List<Producto> productos = productoService.listarActivos();
        assertThat(productos).isNotNull();
        // Si hay datos cargados, todos deben estar activos
        productos.forEach(p -> assertThat(p.getActivo()).isTrue());
    }

    // ── TEST 6: Listar clientes retorna lista ─────────────────────────────
    @Test
    @DisplayName("T06 - listarActivos() de ClienteService retorna lista de clientes")
    void testListarClientes() {
        List<Cliente> clientes = clienteService.listarActivos();
        assertThat(clientes).isNotNull();
    }

    // ── TEST 7: Crear producto con codigo nulo lanza excepcion ─────────────
    @Test
    @DisplayName("T07 - Crear producto con codigo nulo lanza IllegalArgumentException o excepcion de BD")
    void testCrearProductoCodigoNulo() {
        Producto invalido = new Producto();
        invalido.setCodigo(null);
        invalido.setNombre("Producto Sin Codigo");
        invalido.setCategoria("Celulares");
        invalido.setMarca("TestMarca");
        invalido.setStock(0);
        invalido.setActivo(true);

        // Debe lanzar alguna excepcion al intentar guardar sin codigo (NOT NULL en BD)
        assertThatThrownBy(() -> productoService.crear(invalido))
                .isInstanceOf(Exception.class);
    }

    // ── TEST 8: Crear cliente con doc duplicado lanza excepcion ───────────
    @Test
    @DisplayName("T08 - Crear cliente con documento ya registrado lanza IllegalArgumentException")
    void testCrearClienteDocDuplicado() {
        // Primero obtenemos un cliente existente para usar su doc
        List<Cliente> clientes = clienteService.listarActivos();
        if (clientes.isEmpty()) return; // Si no hay clientes, omitir prueba

        String docExistente = clientes.get(0).getDoc();
        Cliente duplicado = new Cliente();
        duplicado.setDoc(docExistente);
        duplicado.setNombre("Cliente Duplicado");
        duplicado.setActivo(true);

        assertThatThrownBy(() -> clienteService.crear(duplicado))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(docExistente);
    }

    // ── TEST 9: Buscar producto por ID inexistente lanza excepcion ─────────
    @Test
    @DisplayName("T09 - Obtener producto con ID inexistente lanza EntityNotFoundException")
    void testProductoNoEncontrado() {
        assertThatThrownBy(() -> productoService.obtenerPorId(999999L))
                .isInstanceOf(jakarta.persistence.EntityNotFoundException.class);
    }

    // ── TEST 10: Todos los productos activos tienen stock >= 0 ────────────
    @Test
    @DisplayName("T10 - Todos los productos activos tienen stock mayor o igual a cero")
    void testProductosStockNoNegativo() {
        List<Producto> productos = productoService.listarActivos();
        productos.forEach(p ->
            assertThat(p.getStock())
                .as("Stock del producto '%s' no debe ser negativo", p.getNombre())
                .isGreaterThanOrEqualTo(0)
        );
    }
}
