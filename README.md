# 🪐 ORBIT — 3D Solar System & Asteroid Impact Laboratory

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://metantonio.github.io/orbital/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-blue.svg)](https://www.khronos.org/webgl/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Scientific%20Visualization-brightgreen.svg)]()

> 🌐 **Live Demo:** [https://metantonio.github.io/orbital/](https://metantonio.github.io/orbital/)

**ORBIT** es un planetario interactivo 3D y laboratorio de mecánica celeste y física de impactos de asteroides de alta fidelidad, contenido en **un único archivo autónomo (`index.html`)** desarrollado con Three.js, shaders GLSL personalizados y modelos orbitales basados en las efemérides J2000 del NASA Jet Propulsion Laboratory (JPL).

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

### ☄️ 4. Catálogo de Asteroides Cercanos (NEOs) y Cono de Incertidumbre 3D
* **Asteroides Reales en Base de Datos:**
  * **`99942 Apophis`:** Paso cercano el **13 de abril de 2029** a tan solo $31,600\text{ km}$ ($0.082\text{ LD}$, por debajo de la órbita geoestacionaria). Diámetro: $370\text{ m}$, velocidad: $30.73\text{ km/s}$, tipo rocoso.
  * **`101955 Bennu`:** Paso cercano el **23 de septiembre de 2037** a $485,000\text{ km}$ ($1.26\text{ LD}$). Diámetro: $490\text{ m}$, densidad: $1190\text{ kg/m}^3$ (carbonáceo).
  * **`(29075) 1950 DA`:** Paso cercano el **16 de marzo de 2039** a $820,000\text{ km}$ ($2.13\text{ LD}$). Diámetro: $1.3\text{ km}$ (clase kilométrica metálica).
  * **`2023 DW`:** Encuentro de San Valentín el **14 de febrero de 2046** a $1.8\text{ M km}$. Diámetro: $50\text{ m}$.
* **Corredor de Incertidumbre ($3\sigma$ Error Cone):** Visualización 3D translúcida del margen de dispersión orbital alrededor de la Tierra.
* **Simulación con Un Clic:** Botones directos para inspeccionar la trayectoria orbital y agendar simulaciones inmediatas de colisión contra la Tierra.

---

### 🎥 5. Cámara Orbital con Seguimiento Continuo (*Target Lock*)
* **Seguimiento dinámico:** Al hacer doble clic en un planeta, presionar `F` o seleccionarlo en el explorador, la cámara lo sigue continuamente a lo largo de su órbita heliocéntrica sin perderlo de vista.
* **Transiciones suaves:** Interpolación cúbica con amortiguación inercial (*damping*).

---

### ⏱️ 6. Reloj Astronómico y Calendario UTC Universal
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
* **Three.js (0.160):** Renderizado WebGL acelerado por hardware con pipeline de post-procesamiento (`UnrealBloomPass` para resplandores solares y filamentos de impacto).
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
