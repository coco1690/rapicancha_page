export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_auditoria: {
        Row: {
          accion: string
          admin_id: string
          creado_en: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: number
          negocio_id: string | null
          registro_id: string | null
          tabla: string
        }
        Insert: {
          accion: string
          admin_id: string
          creado_en?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: never
          negocio_id?: string | null
          registro_id?: string | null
          tabla: string
        }
        Update: {
          accion?: string
          admin_id?: string
          creado_en?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: never
          negocio_id?: string | null
          registro_id?: string | null
          tabla?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_auditoria_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_auditoria_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_auditoria_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_auditoria_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      cancha_tarifas: {
        Row: {
          activa: boolean
          cancha_id: string
          created_at: string
          dias_semana: number[]
          hora_fin: string
          hora_inicio: string
          id: string
          moneda_codigo: string
          nombre: string
          precio_minor: number
          tipo: Database["public"]["Enums"]["precio_tipo"]
          updated_at: string
        }
        Insert: {
          activa?: boolean
          cancha_id: string
          created_at?: string
          dias_semana?: number[]
          hora_fin?: string
          hora_inicio?: string
          id?: string
          moneda_codigo: string
          nombre?: string
          precio_minor: number
          tipo?: Database["public"]["Enums"]["precio_tipo"]
          updated_at?: string
        }
        Update: {
          activa?: boolean
          cancha_id?: string
          created_at?: string
          dias_semana?: number[]
          hora_fin?: string
          hora_inicio?: string
          id?: string
          moneda_codigo?: string
          nombre?: string
          precio_minor?: number
          tipo?: Database["public"]["Enums"]["precio_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancha_tarifas_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancha_tarifas_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancha_tarifas_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["cancha_id"]
          },
        ]
      }
      canchas: {
        Row: {
          activa: boolean
          actualizado_en: string
          capacidad_jugadores: number | null
          creado_en: string
          created_at: string | null
          cubierta: boolean | null
          deporte_id: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["cancha_estado"] | null
          id: string
          iluminacion: boolean
          iot_light_switch_id: string | null
          iot_lock_code: string | null
          negocio_id: string
          nombre: string
          precio_por_hora_minor: number
          sede_id: string | null
          superficie: string | null
          techada: boolean
          updated_at: string | null
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          capacidad_jugadores?: number | null
          creado_en?: string
          created_at?: string | null
          cubierta?: boolean | null
          deporte_id: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["cancha_estado"] | null
          id?: string
          iluminacion?: boolean
          iot_light_switch_id?: string | null
          iot_lock_code?: string | null
          negocio_id: string
          nombre: string
          precio_por_hora_minor: number
          sede_id?: string | null
          superficie?: string | null
          techada?: boolean
          updated_at?: string | null
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          capacidad_jugadores?: number | null
          creado_en?: string
          created_at?: string | null
          cubierta?: boolean | null
          deporte_id?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["cancha_estado"] | null
          id?: string
          iluminacion?: boolean
          iot_light_switch_id?: string | null
          iot_lock_code?: string | null
          negocio_id?: string
          nombre?: string
          precio_por_hora_minor?: number
          sede_id?: string | null
          superficie?: string | null
          techada?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canchas_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["deporte_id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
          {
            foreignKeyName: "canchas_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_evento: {
        Row: {
          activa: boolean
          configuracion: Json
          created_at: string
          edad_maxima: number | null
          edad_minima: number | null
          evento_id: string
          genero: string | null
          id: string
          modalidad_evento_id: string | null
          negocio_id: string
          nivel: string | null
          nombre: string
          orden: number
          peso_maximo: number | null
          peso_minimo: number | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          configuracion?: Json
          created_at?: string
          edad_maxima?: number | null
          edad_minima?: number | null
          evento_id: string
          genero?: string | null
          id?: string
          modalidad_evento_id?: string | null
          negocio_id: string
          nivel?: string | null
          nombre: string
          orden?: number
          peso_maximo?: number | null
          peso_minimo?: number | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          configuracion?: Json
          created_at?: string
          edad_maxima?: number | null
          edad_minima?: number | null
          evento_id?: string
          genero?: string | null
          id?: string
          modalidad_evento_id?: string | null
          negocio_id?: string
          nivel?: string | null
          nombre?: string
          orden?: number
          peso_maximo?: number | null
          peso_minimo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_evento_evento_negocio_fk"
            columns: ["evento_id", "negocio_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "negocio_id"]
          },
          {
            foreignKeyName: "categorias_evento_modalidad_evento_id_fkey"
            columns: ["modalidad_evento_id"]
            isOneToOne: false
            referencedRelation: "modalidades_evento"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_whatsapp: {
        Row: {
          creado_en: string
          id: string
          mensaje: string
          metadata: Json
          negocio_id: string | null
          remitente: string
          telefono_cliente: string
        }
        Insert: {
          creado_en?: string
          id?: string
          mensaje: string
          metadata?: Json
          negocio_id?: string | null
          remitente: string
          telefono_cliente: string
        }
        Update: {
          creado_en?: string
          id?: string
          mensaje?: string
          metadata?: Json
          negocio_id?: string | null
          remitente?: string
          telefono_cliente?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_whatsapp_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_whatsapp_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_whatsapp_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      ciudades: {
        Row: {
          activo: boolean
          created_at: string
          departamento_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          departamento_id: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          departamento_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciudades_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      comisiones_plataforma: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          id: string
          porcentaje: number
          tipo_pago: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          porcentaje?: number
          tipo_pago: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          porcentaje?: number
          tipo_pago?: string
          updated_at?: string
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          id: string
          nombre: string
          pais_id: string
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre: string
          pais_id: string
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre?: string
          pais_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      deportes: {
        Row: {
          activo: boolean
          categoria: string | null
          creado_en: string
          created_at: string | null
          id: string
          jugadores_por_equipo: number | null
          nombre: string
          slug: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          creado_en?: string
          created_at?: string | null
          id?: string
          jugadores_por_equipo?: number | null
          nombre: string
          slug: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          creado_en?: string
          created_at?: string | null
          id?: string
          jugadores_por_equipo?: number | null
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          actualizado_en: string
          capitan_id: string
          ciudad: string
          creado_en: string
          departamento: string
          id: string
          logo_url: string | null
          nombre: string
          pais_codigo: string
        }
        Insert: {
          actualizado_en?: string
          capitan_id: string
          ciudad: string
          creado_en?: string
          departamento: string
          id?: string
          logo_url?: string | null
          nombre: string
          pais_codigo: string
        }
        Update: {
          actualizado_en?: string
          capitan_id?: string
          ciudad?: string
          creado_en?: string
          departamento?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          pais_codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_capitan_id_fkey"
            columns: ["capitan_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_pais_codigo_fkey"
            columns: ["pais_codigo"]
            isOneToOne: false
            referencedRelation: "paises_operacion"
            referencedColumns: ["codigo"]
          },
        ]
      }
      eventos: {
        Row: {
          capacidad_total: number | null
          ciudad_id: string | null
          configuracion: Json
          created_at: string
          deporte_id: string
          descripcion: string | null
          direccion: string | null
          dorsal_inicial: number
          es_publico: boolean
          estado: Database["public"]["Enums"]["evento_estado"]
          fin_at: string
          id: string
          inicio_at: string
          inscripciones_abren_en: string | null
          inscripciones_cierran_en: string | null
          latitud: number | null
          longitud: number | null
          moneda_codigo: string
          negocio_id: string
          nombre: string
          portada_url: string | null
          reglamento_url: string | null
          requiere_dorsal: boolean
          slug: string
          solicita_talla_camiseta: boolean
          tallas_camiseta: string[]
          updated_at: string
          zona_horaria: string
        }
        Insert: {
          capacidad_total?: number | null
          ciudad_id?: string | null
          configuracion?: Json
          created_at?: string
          deporte_id: string
          descripcion?: string | null
          direccion?: string | null
          dorsal_inicial?: number
          es_publico?: boolean
          estado?: Database["public"]["Enums"]["evento_estado"]
          fin_at: string
          id?: string
          inicio_at: string
          inscripciones_abren_en?: string | null
          inscripciones_cierran_en?: string | null
          latitud?: number | null
          longitud?: number | null
          moneda_codigo: string
          negocio_id: string
          nombre: string
          portada_url?: string | null
          reglamento_url?: string | null
          requiere_dorsal?: boolean
          slug: string
          solicita_talla_camiseta?: boolean
          tallas_camiseta?: string[]
          updated_at?: string
          zona_horaria: string
        }
        Update: {
          capacidad_total?: number | null
          ciudad_id?: string | null
          configuracion?: Json
          created_at?: string
          deporte_id?: string
          descripcion?: string | null
          direccion?: string | null
          dorsal_inicial?: number
          es_publico?: boolean
          estado?: Database["public"]["Enums"]["evento_estado"]
          fin_at?: string
          id?: string
          inicio_at?: string
          inscripciones_abren_en?: string | null
          inscripciones_cierran_en?: string | null
          latitud?: number | null
          longitud?: number | null
          moneda_codigo?: string
          negocio_id?: string
          nombre?: string
          portada_url?: string | null
          reglamento_url?: string | null
          requiere_dorsal?: boolean
          slug?: string
          solicita_talla_camiseta?: boolean
          tallas_camiseta?: string[]
          updated_at?: string
          zona_horaria?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["deporte_id"]
          },
          {
            foreignKeyName: "eventos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      inscripciones_evento: {
        Row: {
          cargo_fijo_pasarela_snapshot_minor: number
          cargo_pasarela_minor: number
          categoria_evento_id: string | null
          comprador_usuario_id: string | null
          created_at: string
          descuento_minor: number
          estado: Database["public"]["Enums"]["inscripcion_evento_estado"]
          evento_id: string
          expira_en: string | null
          id: string
          impuesto_pasarela_snapshot: number
          modalidad_evento_id: string
          moneda_codigo: string
          negocio_id: string
          numero_dorsal: string | null
          numero_inscripcion: string
          participante_id: string
          peso_declarado: number | null
          precio_base_minor: number
          privacidad_aceptada_en: string
          referencia_publica: string
          talla_camiseta: string | null
          tarifa_plataforma_minor: number
          tasa_pasarela_snapshot: number
          tasa_plataforma_snapshot: number
          terminos_aceptados_en: string
          total_minor: number
          updated_at: string
        }
        Insert: {
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          categoria_evento_id?: string | null
          comprador_usuario_id?: string | null
          created_at?: string
          descuento_minor?: number
          estado?: Database["public"]["Enums"]["inscripcion_evento_estado"]
          evento_id: string
          expira_en?: string | null
          id?: string
          impuesto_pasarela_snapshot?: number
          modalidad_evento_id: string
          moneda_codigo: string
          negocio_id: string
          numero_dorsal?: string | null
          numero_inscripcion: string
          participante_id: string
          peso_declarado?: number | null
          precio_base_minor: number
          privacidad_aceptada_en: string
          referencia_publica: string
          talla_camiseta?: string | null
          tarifa_plataforma_minor?: number
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          terminos_aceptados_en: string
          total_minor: number
          updated_at?: string
        }
        Update: {
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          categoria_evento_id?: string | null
          comprador_usuario_id?: string | null
          created_at?: string
          descuento_minor?: number
          estado?: Database["public"]["Enums"]["inscripcion_evento_estado"]
          evento_id?: string
          expira_en?: string | null
          id?: string
          impuesto_pasarela_snapshot?: number
          modalidad_evento_id?: string
          moneda_codigo?: string
          negocio_id?: string
          numero_dorsal?: string | null
          numero_inscripcion?: string
          participante_id?: string
          peso_declarado?: number | null
          precio_base_minor?: number
          privacidad_aceptada_en?: string
          referencia_publica?: string
          talla_camiseta?: string | null
          tarifa_plataforma_minor?: number
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          terminos_aceptados_en?: string
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_evento_categoria_evento_id_fkey"
            columns: ["categoria_evento_id"]
            isOneToOne: false
            referencedRelation: "categorias_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_evento_evento_negocio_fk"
            columns: ["evento_id", "negocio_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "negocio_id"]
          },
          {
            foreignKeyName: "inscripciones_evento_modalidad_evento_id_fkey"
            columns: ["modalidad_evento_id"]
            isOneToOne: false
            referencedRelation: "modalidades_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_evento_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones_torneo: {
        Row: {
          creado_en: string
          equipo_id: string
          id: string
          torneo_id: string
        }
        Insert: {
          creado_en?: string
          equipo_id: string
          id?: string
          torneo_id: string
        }
        Update: {
          creado_en?: string
          equipo_id?: string
          id?: string
          torneo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_torneo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_torneo_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_torneo_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadores_equipo: {
        Row: {
          creado_en: string
          equipo_id: string
          id: string
          identificacion: string
          nombre: string
          numero_camiseta: number | null
          telefono: string | null
        }
        Insert: {
          creado_en?: string
          equipo_id: string
          id?: string
          identificacion: string
          nombre: string
          numero_camiseta?: number | null
          telefono?: string | null
        }
        Update: {
          creado_en?: string
          equipo_id?: string
          id?: string
          identificacion?: string
          nombre?: string
          numero_camiseta?: number | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_equipo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadores_inscritos_torneo: {
        Row: {
          creado_en: string
          id: string
          inscripcion_torneo_id: string
          jugador_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          inscripcion_torneo_id: string
          jugador_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          inscripcion_torneo_id?: string
          jugador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_inscritos_torneo_inscripcion_torneo_id_fkey"
            columns: ["inscripcion_torneo_id"]
            isOneToOne: false
            referencedRelation: "inscripciones_torneo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_inscritos_torneo_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores_equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades_evento: {
        Row: {
          activa: boolean
          capacidad: number | null
          configuracion: Json
          created_at: string
          descripcion: string | null
          distancia: number | null
          evento_id: string
          id: string
          inicio_at: string | null
          moneda_codigo: string
          negocio_id: string
          nombre: string
          orden: number
          precio_base_minor: number
          slug: string
          unidad_distancia: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          capacidad?: number | null
          configuracion?: Json
          created_at?: string
          descripcion?: string | null
          distancia?: number | null
          evento_id: string
          id?: string
          inicio_at?: string | null
          moneda_codigo: string
          negocio_id: string
          nombre: string
          orden?: number
          precio_base_minor?: number
          slug: string
          unidad_distancia?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          capacidad?: number | null
          configuracion?: Json
          created_at?: string
          descripcion?: string | null
          distancia?: number | null
          evento_id?: string
          id?: string
          inicio_at?: string | null
          moneda_codigo?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          precio_base_minor?: number
          slug?: string
          unidad_distancia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modalidades_evento_evento_negocio_fk"
            columns: ["evento_id", "negocio_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "negocio_id"]
          },
        ]
      }
      negocios: {
        Row: {
          actualizado_en: string
          ciudad: string
          ciudad_id: string | null
          creado_en: string
          created_at: string | null
          departamento: string
          descripcion: string | null
          direccion: string
          dueno_id: string
          email: string | null
          estado: Database["public"]["Enums"]["negocio_estado"] | null
          estado_suscripcion: Database["public"]["Enums"]["subscription_status"]
          fecha_fin_prueba: string | null
          horario_apertura: string
          horario_cierre: string
          id: string
          lat: number | null
          latitud: number | null
          lng: number | null
          logo_url: string | null
          longitud: number | null
          modulos_activos: string[]
          moneda: string
          moneda_codigo: string | null
          nombre: string
          pais_codigo: string
          payment_provider: string
          plan_id: string
          provider_account_id: string | null
          provider_onboarding_status: string
          provider_payload: Json
          slug: string
          stripe_account_id: string | null
          stripe_connect_id: string | null
          telefono: string | null
          timezone: string
          updated_at: string | null
          whatsapp_notificaciones_activas: boolean
          whatsapp_telefono_e164: string | null
          zona_horaria: string | null
        }
        Insert: {
          actualizado_en?: string
          ciudad: string
          ciudad_id?: string | null
          creado_en?: string
          created_at?: string | null
          departamento: string
          descripcion?: string | null
          direccion: string
          dueno_id: string
          email?: string | null
          estado?: Database["public"]["Enums"]["negocio_estado"] | null
          estado_suscripcion?: Database["public"]["Enums"]["subscription_status"]
          fecha_fin_prueba?: string | null
          horario_apertura: string
          horario_cierre: string
          id?: string
          lat?: number | null
          latitud?: number | null
          lng?: number | null
          logo_url?: string | null
          longitud?: number | null
          modulos_activos?: string[]
          moneda?: string
          moneda_codigo?: string | null
          nombre: string
          pais_codigo?: string
          payment_provider?: string
          plan_id: string
          provider_account_id?: string | null
          provider_onboarding_status?: string
          provider_payload?: Json
          slug: string
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          telefono?: string | null
          timezone?: string
          updated_at?: string | null
          whatsapp_notificaciones_activas?: boolean
          whatsapp_telefono_e164?: string | null
          zona_horaria?: string | null
        }
        Update: {
          actualizado_en?: string
          ciudad?: string
          ciudad_id?: string | null
          creado_en?: string
          created_at?: string | null
          departamento?: string
          descripcion?: string | null
          direccion?: string
          dueno_id?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["negocio_estado"] | null
          estado_suscripcion?: Database["public"]["Enums"]["subscription_status"]
          fecha_fin_prueba?: string | null
          horario_apertura?: string
          horario_cierre?: string
          id?: string
          lat?: number | null
          latitud?: number | null
          lng?: number | null
          logo_url?: string | null
          longitud?: number | null
          modulos_activos?: string[]
          moneda?: string
          moneda_codigo?: string | null
          nombre?: string
          pais_codigo?: string
          payment_provider?: string
          plan_id?: string
          provider_account_id?: string | null
          provider_onboarding_status?: string
          provider_payload?: Json
          slug?: string
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          telefono?: string | null
          timezone?: string
          updated_at?: string | null
          whatsapp_notificaciones_activas?: boolean
          whatsapp_telefono_e164?: string | null
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_pais_codigo_fkey"
            columns: ["pais_codigo"]
            isOneToOne: false
            referencedRelation: "paises_operacion"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "negocios_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_negocio: {
        Row: {
          creado_en: string
          datos: Json
          id: string
          leida: boolean
          mensaje: string
          negocio_id: string
          reserva_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          creado_en?: string
          datos?: Json
          id?: string
          leida?: boolean
          mensaje: string
          negocio_id: string
          reserva_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          creado_en?: string
          datos?: Json
          id?: string
          leida?: boolean
          mensaje?: string
          negocio_id?: string
          reserva_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
          {
            foreignKeyName: "notificaciones_negocio_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          actualizado_en: string
          cargo_fijo_pasarela_snapshot_minor: number
          cargo_pasarela_minor: number
          comision_plataforma_minor: number
          creado_en: string
          estado: Database["public"]["Enums"]["payment_status"]
          id: string
          impuesto_pasarela_snapshot: number
          inscripcion_evento_id: string | null
          inscripcion_torneo_id: string | null
          moneda: string
          monto_base_minor: number
          monto_total_minor: number
          negocio_id: string
          neto_negocio_minor: number
          payment_provider: string
          provider_account_id: string | null
          provider_checkout_id: string | null
          provider_checkout_url: string | null
          provider_payload: Json
          provider_payment_id: string | null
          provider_reference: string | null
          reserva_id: string | null
          stripe_checkout_session_id: string | null
          stripe_connect_account_id: string | null
          stripe_payment_intent_id: string | null
          suscripcion_id: string | null
          tasa_pasarela_snapshot: number
          tasa_plataforma_snapshot: number
          tipo_pago: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          actualizado_en?: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor: number
          creado_en?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          id?: string
          impuesto_pasarela_snapshot?: number
          inscripcion_evento_id?: string | null
          inscripcion_torneo_id?: string | null
          moneda: string
          monto_base_minor?: number
          monto_total_minor: number
          negocio_id: string
          neto_negocio_minor: number
          payment_provider?: string
          provider_account_id?: string | null
          provider_checkout_id?: string | null
          provider_checkout_url?: string | null
          provider_payload?: Json
          provider_payment_id?: string | null
          provider_reference?: string | null
          reserva_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_payment_intent_id?: string | null
          suscripcion_id?: string | null
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          tipo_pago: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          actualizado_en?: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor?: number
          creado_en?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          id?: string
          impuesto_pasarela_snapshot?: number
          inscripcion_evento_id?: string | null
          inscripcion_torneo_id?: string | null
          moneda?: string
          monto_base_minor?: number
          monto_total_minor?: number
          negocio_id?: string
          neto_negocio_minor?: number
          payment_provider?: string
          provider_account_id?: string | null
          provider_checkout_id?: string | null
          provider_checkout_url?: string | null
          provider_payload?: Json
          provider_payment_id?: string | null
          provider_reference?: string | null
          reserva_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_payment_intent_id?: string | null
          suscripcion_id?: string | null
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          tipo_pago?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_inscripcion_evento_id_fkey"
            columns: ["inscripcion_evento_id"]
            isOneToOne: false
            referencedRelation: "inscripciones_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_inscripcion_torneo_id_fkey"
            columns: ["inscripcion_torneo_id"]
            isOneToOne: false
            referencedRelation: "inscripciones_torneo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
          {
            foreignKeyName: "pagos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      paises: {
        Row: {
          activo: boolean
          codigo_iso2: string
          created_at: string
          id: string
          indicativo_pais: string | null
          moneda_codigo: string
          moneda_simbolo: string
          nombre: string
          zona_horaria_default: string
        }
        Insert: {
          activo?: boolean
          codigo_iso2: string
          created_at?: string
          id?: string
          indicativo_pais?: string | null
          moneda_codigo: string
          moneda_simbolo: string
          nombre: string
          zona_horaria_default: string
        }
        Update: {
          activo?: boolean
          codigo_iso2?: string
          created_at?: string
          id?: string
          indicativo_pais?: string | null
          moneda_codigo?: string
          moneda_simbolo?: string
          nombre?: string
          zona_horaria_default?: string
        }
        Relationships: []
      }
      paises_operacion: {
        Row: {
          activo: boolean
          codigo: string
          creado_en: string
          moneda_default: string
          nombre: string
          payment_providers_disponibles: string[]
          stripe_connect_disponible: boolean
          timezone_default: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          creado_en?: string
          moneda_default: string
          nombre: string
          payment_providers_disponibles?: string[]
          stripe_connect_disponible?: boolean
          timezone_default: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          creado_en?: string
          moneda_default?: string
          nombre?: string
          payment_providers_disponibles?: string[]
          stripe_connect_disponible?: boolean
          timezone_default?: string
        }
        Relationships: []
      }
      participantes: {
        Row: {
          apellidos: string
          contacto_emergencia_nombre: string
          contacto_emergencia_telefono_e164: string
          created_at: string
          email: string
          fecha_nacimiento: string
          genero: string | null
          id: string
          nombres: string
          numero_documento: string
          telefono_e164: string
          tipo_documento: string
          updated_at: string
          usuario_propietario_id: string | null
        }
        Insert: {
          apellidos: string
          contacto_emergencia_nombre: string
          contacto_emergencia_telefono_e164: string
          created_at?: string
          email: string
          fecha_nacimiento: string
          genero?: string | null
          id?: string
          nombres: string
          numero_documento: string
          telefono_e164: string
          tipo_documento: string
          updated_at?: string
          usuario_propietario_id?: string | null
        }
        Update: {
          apellidos?: string
          contacto_emergencia_nombre?: string
          contacto_emergencia_telefono_e164?: string
          created_at?: string
          email?: string
          fecha_nacimiento?: string
          genero?: string | null
          id?: string
          nombres?: string
          numero_documento?: string
          telefono_e164?: string
          tipo_documento?: string
          updated_at?: string
          usuario_propietario_id?: string | null
        }
        Relationships: []
      }
      partidos: {
        Row: {
          actualizado_en: string
          creado_en: string
          equipo_local_id: string
          equipo_visitante_id: string
          estado: Database["public"]["Enums"]["match_status"]
          fase: string
          fecha_local: string
          ganador_id: string | null
          grupo: string | null
          hora_local: string
          id: string
          marcador_local: Json | null
          marcador_visitante: Json | null
          reserva_id: string | null
          torneo_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          equipo_local_id: string
          equipo_visitante_id: string
          estado?: Database["public"]["Enums"]["match_status"]
          fase?: string
          fecha_local: string
          ganador_id?: string | null
          grupo?: string | null
          hora_local: string
          id?: string
          marcador_local?: Json | null
          marcador_visitante?: Json | null
          reserva_id?: string | null
          torneo_id: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          equipo_local_id?: string
          equipo_visitante_id?: string
          estado?: Database["public"]["Enums"]["match_status"]
          fase?: string
          fecha_local?: string
          ganador_id?: string | null
          grupo?: string | null
          hora_local?: string
          id?: string
          marcador_local?: Json | null
          marcador_visitante?: Json | null
          reserva_id?: string | null
          torneo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidos_equipo_local_id_fkey"
            columns: ["equipo_local_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_equipo_visitante_id_fkey"
            columns: ["equipo_visitante_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_ganador_id_fkey"
            columns: ["ganador_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          activo: boolean
          creado_en: string
          created_at: string | null
          descripcion: string | null
          eventos_habilitados: boolean
          id: string
          limite_canchas: number
          limite_eventos: number | null
          moneda: string
          moneda_codigo: string | null
          nombre: string
          payment_provider: string | null
          precio_mensual_minor: number
          provider_price_id: string | null
          slug: string | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          created_at?: string | null
          descripcion?: string | null
          eventos_habilitados?: boolean
          id?: string
          limite_canchas: number
          limite_eventos?: number | null
          moneda?: string
          moneda_codigo?: string | null
          nombre: string
          payment_provider?: string | null
          precio_mensual_minor: number
          provider_price_id?: string | null
          slug?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          created_at?: string | null
          descripcion?: string | null
          eventos_habilitados?: boolean
          id?: string
          limite_canchas?: number
          limite_eventos?: number | null
          moneda?: string
          moneda_codigo?: string | null
          nombre?: string
          payment_provider?: string | null
          precio_mensual_minor?: number
          provider_price_id?: string | null
          slug?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rapicancha_migrations: {
        Row: {
          aplicado_en: string
          id: string
        }
        Insert: {
          aplicado_en?: string
          id: string
        }
        Update: {
          aplicado_en?: string
          id?: string
        }
        Relationships: []
      }
      reservas: {
        Row: {
          acepta_marketing_negocio: boolean
          acepta_notificaciones_whatsapp: boolean
          acepta_terminos: boolean
          actualizado_en: string
          cancha_id: string
          cargo_fijo_pasarela_snapshot_minor: number
          cargo_pasarela_minor: number
          comision_plataforma_minor: number
          creado_en: string
          email_cliente: string | null
          estado_reserva: Database["public"]["Enums"]["booking_status"]
          fecha_local: string
          fin_at: string
          hora_fin_local: string
          hora_inicio_local: string
          id: string
          impuesto_pasarela_snapshot: number
          inicio_at: string
          jugadores_faltantes: number
          moneda: string
          negocio_id: string
          nombre_cliente: string
          origen: Database["public"]["Enums"]["booking_origin"]
          partido_abierto: boolean
          precio_base_minor: number
          precio_total_minor: number
          referencia_publica: string
          seguro_cancelacion_activo: boolean
          tasa_pasarela_snapshot: number
          tasa_plataforma_snapshot: number
          telefono_cliente: string
          telefono_cliente_e164: string | null
          terminos_aceptados_en: string | null
          terminos_version: string | null
          timezone: string
          usuario_id: string | null
        }
        Insert: {
          acepta_marketing_negocio?: boolean
          acepta_notificaciones_whatsapp?: boolean
          acepta_terminos?: boolean
          actualizado_en?: string
          cancha_id: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor?: number
          creado_en?: string
          email_cliente?: string | null
          estado_reserva?: Database["public"]["Enums"]["booking_status"]
          fecha_local: string
          fin_at: string
          hora_fin_local: string
          hora_inicio_local: string
          id?: string
          impuesto_pasarela_snapshot?: number
          inicio_at: string
          jugadores_faltantes?: number
          moneda: string
          negocio_id: string
          nombre_cliente: string
          origen?: Database["public"]["Enums"]["booking_origin"]
          partido_abierto?: boolean
          precio_base_minor?: number
          precio_total_minor: number
          referencia_publica?: string
          seguro_cancelacion_activo?: boolean
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          telefono_cliente: string
          telefono_cliente_e164?: string | null
          terminos_aceptados_en?: string | null
          terminos_version?: string | null
          timezone: string
          usuario_id?: string | null
        }
        Update: {
          acepta_marketing_negocio?: boolean
          acepta_notificaciones_whatsapp?: boolean
          acepta_terminos?: boolean
          actualizado_en?: string
          cancha_id?: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor?: number
          creado_en?: string
          email_cliente?: string | null
          estado_reserva?: Database["public"]["Enums"]["booking_status"]
          fecha_local?: string
          fin_at?: string
          hora_fin_local?: string
          hora_inicio_local?: string
          id?: string
          impuesto_pasarela_snapshot?: number
          inicio_at?: string
          jugadores_faltantes?: number
          moneda?: string
          negocio_id?: string
          nombre_cliente?: string
          origen?: Database["public"]["Enums"]["booking_origin"]
          partido_abierto?: boolean
          precio_base_minor?: number
          precio_total_minor?: number
          referencia_publica?: string
          seguro_cancelacion_activo?: boolean
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          telefono_cliente?: string
          telefono_cliente_e164?: string | null
          terminos_aceptados_en?: string | null
          terminos_version?: string | null
          timezone?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_cancha_negocio_fk"
            columns: ["cancha_id", "negocio_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id", "negocio_id"]
          },
          {
            foreignKeyName: "reservas_cancha_negocio_fk"
            columns: ["cancha_id", "negocio_id"]
            isOneToOne: false
            referencedRelation: "canchas_publicas"
            referencedColumns: ["id", "negocio_id"]
          },
          {
            foreignKeyName: "reservas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes: {
        Row: {
          activa: boolean
          ciudad_id: string | null
          created_at: string
          direccion: string | null
          id: string
          latitud: number | null
          longitud: number | null
          negocio_id: string
          nombre: string
          telefono: string | null
          updated_at: string
          zona_horaria: string | null
        }
        Insert: {
          activa?: boolean
          ciudad_id?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          negocio_id: string
          nombre: string
          telefono?: string | null
          updated_at?: string
          zona_horaria?: string | null
        }
        Update: {
          activa?: boolean
          ciudad_id?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          negocio_id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sedes_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sedes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sedes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sedes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      soporte_casos: {
        Row: {
          actualizado_en: string
          asignado_a: string | null
          creado_en: string
          creado_por: string
          descripcion: string
          estado: string
          id: string
          negocio_id: string
          prioridad: string
          resolucion: string | null
          resuelto_en: string | null
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          asignado_a?: string | null
          creado_en?: string
          creado_por: string
          descripcion: string
          estado?: string
          id?: string
          negocio_id: string
          prioridad?: string
          resolucion?: string | null
          resuelto_en?: string | null
          titulo: string
        }
        Update: {
          actualizado_en?: string
          asignado_a?: string | null
          creado_en?: string
          creado_por?: string
          descripcion?: string
          estado?: string
          id?: string
          negocio_id?: string
          prioridad?: string
          resolucion?: string | null
          resuelto_en?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "soporte_casos_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_casos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_casos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_casos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_casos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          actualizado_en: string
          cargo_fijo_pasarela_snapshot_minor: number
          cargo_pasarela_minor: number
          comision_plataforma_minor: number
          creado_en: string
          estado: Database["public"]["Enums"]["subscription_status"]
          id: string
          impuesto_pasarela_snapshot: number
          moneda_codigo: string | null
          negocio_id: string
          payment_provider: string
          periodo_fin: string
          periodo_inicio: string
          plan_id: string
          precio_base_minor: number
          provider_subscription_id: string | null
          stripe_subscription_id: string
          tasa_pasarela_snapshot: number
          tasa_plataforma_snapshot: number
          total_minor: number
        }
        Insert: {
          actualizado_en?: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor?: number
          creado_en?: string
          estado: Database["public"]["Enums"]["subscription_status"]
          id?: string
          impuesto_pasarela_snapshot?: number
          moneda_codigo?: string | null
          negocio_id: string
          payment_provider?: string
          periodo_fin: string
          periodo_inicio: string
          plan_id: string
          precio_base_minor?: number
          provider_subscription_id?: string | null
          stripe_subscription_id: string
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          total_minor?: number
        }
        Update: {
          actualizado_en?: string
          cargo_fijo_pasarela_snapshot_minor?: number
          cargo_pasarela_minor?: number
          comision_plataforma_minor?: number
          creado_en?: string
          estado?: Database["public"]["Enums"]["subscription_status"]
          id?: string
          impuesto_pasarela_snapshot?: number
          moneda_codigo?: string | null
          negocio_id?: string
          payment_provider?: string
          periodo_fin?: string
          periodo_inicio?: string
          plan_id?: string
          precio_base_minor?: number
          provider_subscription_id?: string | null
          stripe_subscription_id?: string
          tasa_pasarela_snapshot?: number
          tasa_plataforma_snapshot?: number
          total_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      tabla_posiciones: {
        Row: {
          actualizado_en: string
          contra: number
          creado_en: string
          detalles_deporte: Json
          diferencia: number
          empatados: number
          equipo_id: string
          favor: number
          ganados: number
          id: string
          partidos_jugados: number
          perdidos: number
          puntos: number
          torneo_id: string
        }
        Insert: {
          actualizado_en?: string
          contra?: number
          creado_en?: string
          detalles_deporte?: Json
          diferencia?: number
          empatados?: number
          equipo_id: string
          favor?: number
          ganados?: number
          id?: string
          partidos_jugados?: number
          perdidos?: number
          puntos?: number
          torneo_id: string
        }
        Update: {
          actualizado_en?: string
          contra?: number
          creado_en?: string
          detalles_deporte?: Json
          diferencia?: number
          empatados?: number
          equipo_id?: string
          favor?: number
          ganados?: number
          id?: string
          partidos_jugados?: number
          perdidos?: number
          puntos?: number
          torneo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabla_posiciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabla_posiciones_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabla_posiciones_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifas_cancha: {
        Row: {
          activa: boolean
          cancha_id: string
          creado_en: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          precio_por_hora_minor: number
        }
        Insert: {
          activa?: boolean
          cancha_id: string
          creado_en?: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          precio_por_hora_minor: number
        }
        Update: {
          activa?: boolean
          cancha_id?: string
          creado_en?: string
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          precio_por_hora_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_cancha_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_cancha_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_cancha_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["cancha_id"]
          },
        ]
      }
      tarifas_pasarela: {
        Row: {
          activa: boolean
          cargo_fijo_minor: number
          created_at: string
          descripcion: string | null
          id: string
          impuesto_porcentaje: number
          moneda_codigo: string
          porcentaje: number
          proveedor: string
          tipo_pago: string | null
          updated_at: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activa?: boolean
          cargo_fijo_minor?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          impuesto_porcentaje?: number
          moneda_codigo: string
          porcentaje?: number
          proveedor: string
          tipo_pago?: string | null
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          activa?: boolean
          cargo_fijo_minor?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          impuesto_porcentaje?: number
          moneda_codigo?: string
          porcentaje?: number
          proveedor?: string
          tipo_pago?: string | null
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      torneos: {
        Row: {
          actualizado_en: string
          costo_inscripcion_minor: number
          creado_en: string
          deporte_id: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["tournament_status"]
          fecha_fin: string
          fecha_inicio: string
          id: string
          inscripciones_abren_en: string | null
          inscripciones_cierran_en: string | null
          max_equipos: number
          max_jugadores_por_equipo: number
          moneda: string
          negocio_id: string
          nombre: string
        }
        Insert: {
          actualizado_en?: string
          costo_inscripcion_minor: number
          creado_en?: string
          deporte_id: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["tournament_status"]
          fecha_fin: string
          fecha_inicio: string
          id?: string
          inscripciones_abren_en?: string | null
          inscripciones_cierran_en?: string | null
          max_equipos: number
          max_jugadores_por_equipo?: number
          moneda: string
          negocio_id: string
          nombre: string
        }
        Update: {
          actualizado_en?: string
          costo_inscripcion_minor?: number
          creado_en?: string
          deporte_id?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["tournament_status"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          inscripciones_abren_en?: string | null
          inscripciones_cierran_en?: string | null
          max_equipos?: number
          max_jugadores_por_equipo?: number
          moneda?: string
          negocio_id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["deporte_id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      usuarios: {
        Row: {
          acepta_marketing_global: boolean
          acepto_marketing: boolean | null
          activo: boolean
          ciudad: string | null
          creado_en: string
          created_at: string | null
          departamento: string | null
          email: string
          id: string
          nombre: string
          pais_codigo: string | null
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          acepta_marketing_global?: boolean
          acepto_marketing?: boolean | null
          activo?: boolean
          ciudad?: string | null
          creado_en?: string
          created_at?: string | null
          departamento?: string | null
          email: string
          id: string
          nombre: string
          pais_codigo?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          acepta_marketing_global?: boolean
          acepto_marketing?: boolean | null
          activo?: boolean
          ciudad?: string | null
          creado_en?: string
          created_at?: string | null
          departamento?: string | null
          email?: string
          id?: string
          nombre?: string
          pais_codigo?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_pais_codigo_fkey"
            columns: ["pais_codigo"]
            isOneToOne: false
            referencedRelation: "paises_operacion"
            referencedColumns: ["codigo"]
          },
        ]
      }
      whatsapp_notificaciones: {
        Row: {
          actualizado_en: string
          creado_en: string
          destinatario: string
          entregado_en: string | null
          enviado_en: string | null
          error_codigo: string | null
          error_detalle: string | null
          estado: string
          evento: string
          id: string
          intentos: number
          leido_en: string | null
          negocio_id: string
          proximo_intento_en: string
          reserva_id: string
          twilio_message_sid: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          destinatario: string
          entregado_en?: string | null
          enviado_en?: string | null
          error_codigo?: string | null
          error_detalle?: string | null
          estado?: string
          evento?: string
          id?: string
          intentos?: number
          leido_en?: string | null
          negocio_id: string
          proximo_intento_en?: string
          reserva_id: string
          twilio_message_sid?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          destinatario?: string
          entregado_en?: string | null
          enviado_en?: string | null
          error_codigo?: string | null
          error_detalle?: string | null
          estado?: string
          evento?: string
          id?: string
          intentos?: number
          leido_en?: string | null
          negocio_id?: string
          proximo_intento_en?: string
          reserva_id?: string
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notificaciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_notificaciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_notificaciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
          {
            foreignKeyName: "whatsapp_notificaciones_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      canchas_publicas: {
        Row: {
          capacidad_jugadores: number | null
          deporte_id: string | null
          deporte_nombre: string | null
          deporte_slug: string | null
          id: string | null
          iluminacion: boolean | null
          moneda: string | null
          negocio_id: string | null
          nombre: string | null
          precio_por_hora_minor: number | null
          superficie: string | null
          techada: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "canchas_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["deporte_id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canchas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      negocios_publicos: {
        Row: {
          ciudad: string | null
          departamento: string | null
          horario_apertura: string | null
          horario_cierre: string | null
          id: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          moneda: string | null
          nombre: string | null
          pais_codigo: string | null
          slug: string | null
          timezone: string | null
        }
        Insert: {
          ciudad?: string | null
          departamento?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          moneda?: string | null
          nombre?: string | null
          pais_codigo?: string | null
          slug?: string | null
          timezone?: string | null
        }
        Update: {
          ciudad?: string | null
          departamento?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          moneda?: string | null
          nombre?: string | null
          pais_codigo?: string | null
          slug?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_pais_codigo_fkey"
            columns: ["pais_codigo"]
            isOneToOne: false
            referencedRelation: "paises_operacion"
            referencedColumns: ["codigo"]
          },
        ]
      }
      torneos_publicos: {
        Row: {
          costo_inscripcion_minor: number | null
          deporte_id: string | null
          deporte_nombre: string | null
          deporte_slug: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["tournament_status"] | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string | null
          inscripciones_abren_en: string | null
          inscripciones_cierran_en: string | null
          max_equipos: number | null
          moneda: string | null
          negocio_id: string | null
          negocio_nombre: string | null
          negocio_slug: string | null
          nombre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "torneos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["deporte_id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_canchas"
            referencedColumns: ["negocio_id"]
          },
        ]
      }
      v_marketplace_canchas: {
        Row: {
          cancha_descripcion: string | null
          cancha_id: string | null
          cancha_nombre: string | null
          ciudad: string | null
          cubierta: boolean | null
          departamento: string | null
          deporte_id: string | null
          deporte_nombre: string | null
          deporte_slug: string | null
          direccion: string | null
          latitud: number | null
          longitud: number | null
          moneda_codigo: string | null
          negocio_id: string | null
          negocio_nombre: string | null
          negocio_slug: string | null
          pais: string | null
          pais_codigo: string | null
          superficie: string | null
          zona_horaria: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_whatsapp_notificaciones: {
        Args: { p_limit?: number }
        Returns: {
          actualizado_en: string
          creado_en: string
          destinatario: string
          entregado_en: string | null
          enviado_en: string | null
          error_codigo: string | null
          error_detalle: string | null
          estado: string
          evento: string
          id: string
          intentos: number
          leido_en: string | null
          negocio_id: string
          proximo_intento_en: string
          reserva_id: string
          twilio_message_sid: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "whatsapp_notificaciones"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cotizar_compra: {
        Args: {
          p_moneda_codigo: string
          p_precio_base_minor: number
          p_proveedor: string
          p_tipo_pago: string
        }
        Returns: {
          cargo_fijo_pasarela_minor: number
          cargo_pasarela_minor: number
          comision_plataforma_minor: number
          impuesto_pasarela: number
          precio_base_minor: number
          subtotal_minor: number
          tasa_pasarela: number
          tasa_plataforma: number
          total_minor: number
        }[]
      }
      cotizar_pago: {
        Args: {
          p_comision_plataforma_minor?: number
          p_moneda_codigo: string
          p_precio_base_minor: number
          p_proveedor: string
          p_tipo_pago: string
        }
        Returns: {
          cargo_fijo_pasarela_minor: number
          cargo_pasarela_minor: number
          comision_plataforma_minor: number
          impuesto_pasarela: number
          precio_base_minor: number
          subtotal_minor: number
          tasa_pasarela: number
          total_minor: number
        }[]
      }
      crear_inscripcion_evento_publica: {
        Args: {
          p_acepta_privacidad: boolean
          p_acepta_terminos: boolean
          p_apellidos: string
          p_categoria_evento_id: string
          p_contacto_emergencia_nombre: string
          p_contacto_emergencia_telefono_e164: string
          p_email: string
          p_fecha_nacimiento: string
          p_genero: string
          p_modalidad_evento_id: string
          p_nombres: string
          p_numero_documento: string
          p_peso_declarado: number
          p_talla_camiseta: string
          p_telefono_e164: string
          p_tipo_documento: string
        }
        Returns: {
          expira_en: string
          moneda_codigo: string
          numero_inscripcion: string
          precio_base_minor: number
          referencia_publica: string
          tarifa_plataforma_minor: number
          total_minor: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      owns_negocio: { Args: { target_negocio_id: string }; Returns: boolean }
    }
    Enums: {
      booking_origin: "web" | "pwa" | "whatsapp" | "admin"
      booking_status:
        | "pendiente_pago"
        | "confirmada"
        | "cancelada"
        | "expirada"
        | "reembolsada"
      cancha_estado: "activa" | "mantenimiento" | "inactiva"
      evento_estado:
        | "borrador"
        | "publicado"
        | "en_curso"
        | "finalizado"
        | "cancelado"
      inscripcion_evento_estado:
        | "pendiente_pago"
        | "pagada"
        | "confirmada"
        | "cancelada"
        | "reembolsada"
        | "acreditada"
        | "completada"
      match_status:
        | "programado"
        | "en_juego"
        | "finalizado"
        | "postergado"
        | "cancelado"
      negocio_estado: "borrador" | "activo" | "suspendido" | "cancelado"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payment_type: "reserva" | "torneo" | "suscripcion" | "evento"
      precio_tipo: "hora" | "franja"
      subscription_status:
        | "active"
        | "trialing"
        | "canceled"
        | "past_due"
        | "inactive"
      tournament_status:
        | "inscripciones_abiertas"
        | "en_progreso"
        | "finalizado"
        | "cancelado"
      user_role: "admin" | "negocio" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_origin: ["web", "pwa", "whatsapp", "admin"],
      booking_status: [
        "pendiente_pago",
        "confirmada",
        "cancelada",
        "expirada",
        "reembolsada",
      ],
      cancha_estado: ["activa", "mantenimiento", "inactiva"],
      evento_estado: [
        "borrador",
        "publicado",
        "en_curso",
        "finalizado",
        "cancelado",
      ],
      inscripcion_evento_estado: [
        "pendiente_pago",
        "pagada",
        "confirmada",
        "cancelada",
        "reembolsada",
        "acreditada",
        "completada",
      ],
      match_status: [
        "programado",
        "en_juego",
        "finalizado",
        "postergado",
        "cancelado",
      ],
      negocio_estado: ["borrador", "activo", "suspendido", "cancelado"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payment_type: ["reserva", "torneo", "suscripcion", "evento"],
      precio_tipo: ["hora", "franja"],
      subscription_status: [
        "active",
        "trialing",
        "canceled",
        "past_due",
        "inactive",
      ],
      tournament_status: [
        "inscripciones_abiertas",
        "en_progreso",
        "finalizado",
        "cancelado",
      ],
      user_role: ["admin", "negocio", "cliente"],
    },
  },
} as const
