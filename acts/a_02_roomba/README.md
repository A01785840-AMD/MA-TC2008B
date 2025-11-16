docs.md:

- Problema que se está resolviendo, y la propuesta de solución.
- El diseño de los agentes (objetivo, capacidad efectora, percepción, proactividad, métricas de desempeño, etc.).
- La arquitectura de subsunción de los agentes.
- Características del ambiente.
- Las estadísticas recolectadas en las simulaciones.
- Conclusiones.

El código debe de:

- Habitación de MxN espacios.
- Número de agentes.
- Porcentaje de celdas inicialmente sucias.
- Porcentaje de celdas que actúan como obstáculos.
- Tiempo máximo de ejecución.

Realiza las siguientes simulaciones con las consideraciones que se mencionan 
con estas consideraciones generales:

- Inicializa las celdas sucias en ubicaciones aleatorias.
- Inicializa las celdas con obstáculos en ubicaciones aleatorias.
- El agente tiene una batería que usa cada que quiera hacer una tarea:
- La batería inicia en 100% de carga.
- Cada acción que realiza el agente le quita 1% de batería. Si no realiza una acción, no pierde batería.
- El agente tiene que tener la capacidad de regresar a cargar batería para poder seguir limpiando.
- Cada episodio que el agente esté en la estación de carga, se recarga 5% de la batería.
- El agente tiene como objetivo limpiar el cuarto lo más que pueda en el tiempo máximo de ejecución, sin quedarse sin
- batería.
- Deberás recopilar la siguiente información durante la ejecución:
- Tiempo necesario hasta que todas las celdas estén limpias (o se haya llegado al tiempo máximo).
- Porcentaje de celdas limpias después del termino de la simulación.
- Número de movimientos realizados por el agente.

Simulación 1: Agente individual:

Toma como base las consideraciones generales.
El agente inicia en la celda [1,1]. En esa posición se encuentra una estación de carga.
Simulación 2: Multiples agentes:

Toma como base las consideraciones generales.
Los agentes empiezan en posiciones aleatorias. En esas posiciones van a existir estaciones de carga.
Los agentes conocen solamente la posición de su estación de carga inicial, pero pueden cargarse en cualquier estación de
carga.
Deberás de recopilar los datos solicitados por cada agente.
Analiza cómo la cantidad de agentes impacta el tiempo dedicado, así como la cantidad de movimientos realizados.
Desarrollar un informe con lo observado.