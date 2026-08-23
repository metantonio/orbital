# 🪐 ORBITAL — 3D Solar System & Asteroid Impact Laboratory

[![WebGL](https://img.shields.io/badge/WebGL-2.0-blue.svg)](https://www.khronos.org/webgl/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Scientific%20Visualization-brightgreen.svg)]()

**ORBITAL** es un planetario interactivo 3D y laboratorio de mecánica celeste y física de impactos de asteroides de alta fidelidad, contenido en **un único archivo autónomo (`index.html`)** desarrollado con Three.js, shaders GLSL personalizados y modelos orbitales basados en las efemérides J2000 del NASA Jet Propulsion Laboratory (JPL).

---

## 🚀 Características Principales

### 🌌 1. Mecánica Orbital Kepleriana Precisa (Época J2000.0)
* **Cálculo orbital heliocéntrico analítico:** Resuelve la ecuación trascendente de Kepler ($M = E - e \sin E$) mediante el método numérico de Newton-Raphson para todos los planetas y satélites principales.
* **Elementos orbitales reales:** Semieje mayor ($a$), excentricidad ($e$), inclinación verdadera ($i$), longitud del nodo ascendente ($\Omega$), argumento del perihelio ($\omega$) y anomalía media ($M$) con sus respectivas tasas seculares de precesión ($da, de, di, d\Omega, d\omega, dL$).
* **Planos orbitales 3D unificados:** Todos los planetas y trayectorias comparten el plano de la eclíptica horizontal ($X-Z$) con inclinaciones físicas reales.
* **Modo Científico (`Sci Mode`):** Visualización de discos de plano orbital, vectores de posición y planos nodales.

---

### 🌍 2. Motor de Shaders Planetarios Fotorrealistas
* **Planeta Tierra (*NASA Blue Marble / ISS Style*):**
  * **Geografía y biomas en alta resolución ($2048 \times 1024$):** Contornos continentales reales, selvas tropicales densas, llanuras y bosques templados, desiertos cálidos (Sahara, Arabia, Australia) y casquetes polares glaciares.
  * **Reflejo solar especular (*Sun Glint*):** Máscara dieléctrica donde los océanos reflejan destellos solares dorados y blancos al rotar, mientras los continentes permanecen mate.
  * **Luces nocturnas de ciudades (*NASA Black Marble*):** Concentraciones urbanas iluminadas que se encienden exclusivamente en la cara oscura y se atenúan en el terminador.
  * **Cubierta nubosa elevada ($R \times 1.012$):** Vórtices ciclónicos y banda ecuatorial ITCZ que proyectan sombras sobre la superficie y rotan de forma desacoplada.
  * **Dispersión atmosférica de Rayleigh ($R \times 1.036$):** Halo azul eléctrico diurno y enrojecimiento crepuscular en el terminador.
  * **Inclinación axial astronómica:** Inclinación polar verdadera de $23.44^\circ$.
* **Gigantes Gaseosos y Rocosos:**
  * Bandas atmosféricas dinámicas para Júpiter (con la Gran Mancha Roja) y Saturno con su sistema de anillos anulares texturizados e iluminados.
  * Atmósferas volumétricas para Venus y Marte.
  * Sol dinámico con núcleo emisivo, corona solar y resplandor de dispersión de rayos.

---

### ☄️ 3. Simulador Físico de Impactos de Asteroides
* **Cálculos Balísticos y Energéticos en Tiempo Real:**
  * **Velocidad de impacto:** $v_{\text{imp}} = \sqrt{v_\infty^2 + v_{\text{escape}}^2}$.
  * **Energía cinética:** $E = \frac{1}{2} m v_{\text{imp}}^2$, convertida a Megatones de TNT ($1\text{ MT} = 4.184 \times 10^{15}\text{ J}$).
  * **Diámetro del cráter:** Modelo de escalado de Gault / Collins considerando densidad de proyectil y blanco, gravedad superficial y ángulo de incidencia.
* **Cinemática de Colisión:**
  * Destello de fireball superbrillante, onda de choque expansiva en el punto de impacto y fuente de eyección de escombros (*ejecta particles*).
  * Sacudida de cámara sísmica (*Camera Shake*).
  * **Seguimiento continuo:** La cámara fija y acompaña al planeta en su órbita sin perder el foco ni desbordar la velocidad de simulación.

---

### 🎥 4. Cámara Orbital con Seguimiento Continuo (*Target Lock*)
* **Seguimiento dinámico:** Al hacer doble clic en un planeta, presionar `F` o seleccionarlo en el explorador, la cámara lo sigue continuamente a lo largo de su órbita heliocéntrica sin perderlo de vista.
* **Transiciones suaves:** Interpolación cúbica con amortiguación inercial (*damping*).

---

### ⏱️ 5. Reloj Astronómico y Calendario UTC Universal
* **Sincronización en tiempo real:** Botón **NOW** para sincronizar instantáneamente las posiciones de todos los planetas a la fecha y hora UTC actual exacta.
* **Control de velocidad versátil:** Desde tiempo real ($1\text{ s/s}$), $1\text{ min/s}$, $1\text{ hr/s}$ (modo suave recomendado), $1\text{ día/s}$, hasta avances de siglos por segundo.
* **Sentido de tiempo reversible:** Permite rebobinar o avanzar el reloj astronómico.

---

## 🎮 Controles y Atajos de Teclado

| Atajo / Control | Acción |
| :--- | :--- |
| **Clic Izquierdo + Arrastrar** | Rotar vista orbital alrededor del objetivo |
| **Clic Derecho + Arrastrar** | Desplazar cámara (*Pan*) |
| **Rueda del Ratón** | Zoom in / Zoom out |
| **Doble Clic en un Planeta** | Enfocar y bloquear seguimiento orbital de la cámara |
| **`Espacio`** | Pausar / Reanudar simulación |
| **`F`** | Enfocar cuerpo celeste seleccionado (*Focus & Track*) |
| **`T`** | Mostrar / Ocultar líneas de órbita |
| **`A`** | Abrir configurador de impactos de asteroides |
| **`S`** | Activar / Desactivar Modo Científico |
| **`R`** | Reiniciar simulación a la fecha actual |
| **`Esc`** | Deseleccionar cuerpo celeste |
| **`1` a `5`** | Selección rápida (Sol, Tierra, Luna, Marte, Júpiter) |

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 / CSS3 Moderno:** Arquitectura de paneles HUD semi-transparentes con efecto de desenfoque de fondo (*glassmorphism*), tipografía monoespaciada de precisión y paletas oscuras de alto contraste.
* **JavaScript ES6 Modules:** Estructura modular pura orientada a objetos sin dependencias de compilación ni empaquetadores (Webpack/Vite no requeridos).
* **Three.js (r128):** Renderizado WebGL acelerado por hardware con pipeline de post-procesamiento (`UnrealBloomPass` para resplandores solares y filamentos de impacto).
* **GLSL Shaders:** Shaders personalizados para la atmósfera de Rayleigh, mapa albedo multicapa de la Tierra, nubes procedurales, reflejos especulares y estrellas de fondo.

---

## 📦 Ejecución y Despliegue

Al ser una aplicación 100% autónoma contenida en un único archivo, **no requiere instalación ni Node.js** para ejecutarse:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/metantonio/orbital.git
   cd orbital
   ```
2. Abre `index.html` directamente en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari) o utiliza un servidor HTTP local:
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # O con Node.js
   npx serve .
   ```
3. Navega a `http://localhost:8000`.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.
