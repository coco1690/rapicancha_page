import { ArrowBackOutlined, CheckCircleOutlined } from '@mui/icons-material'
import { Box, Button, Container, Divider, Link as MuiLink, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { CURRENT_TERMS_VERSION } from '../legal/terms'

const sections = [
  {
    title: '1. Identificacion y aceptacion',
    paragraphs: [
      'Estos terminos regulan el acceso y uso de Rapicancha, una plataforma tecnologica para la administracion y comercializacion de reservas deportivas. Al crear una cuenta, contratar un plan o confirmar una reserva, la persona declara que leyo, comprendio y acepto la version vigente de estos terminos.',
      'Rapicancha conserva evidencia de la version y fecha de aceptacion asociadas a cada reserva. Si quien utiliza el servicio actua en nombre de un club o empresa, declara que cuenta con autorizacion suficiente para obligarla.',
    ],
  },
  {
    title: '2. Servicios de Rapicancha',
    paragraphs: [
      'Rapicancha ofrece software como servicio (SaaS) para que los clubes gestionen sus sedes, canchas, tarifas, horarios, reservas, torneos, comunicaciones y operaciones habilitadas en su plan. Tambien opera un marketplace que permite a los clientes consultar disponibilidad y solicitar reservas sin necesidad de crear una cuenta.',
      'Rapicancha facilita la interaccion, el checkout y el registro del pago, pero el club publicado en cada reserva es el prestador directo del servicio deportivo y el responsable de la cancha, sus instalaciones, horarios, seguridad, calidad y atencion al cliente.',
    ],
  },
  {
    title: '3. Planes y suscripciones para clubes',
    paragraphs: [
      'Los clubes pueden contratar planes mensuales cuyos precios, limites de canchas, funciones y condiciones se informan antes de la contratacion. El valor aplicable sera el mostrado al confirmar el plan, incluidos los impuestos y costos adicionales que correspondan.',
      'Las pruebas gratuitas terminan en la fecha informada. Al finalizar una prueba, el club debera contratar un plan para continuar utilizando las funciones restringidas. La cancelacion de una suscripcion impide futuras renovaciones, sin perjuicio de obligaciones ya causadas y de los derechos legales aplicables.',
      'Rapicancha puede suspender funciones por mora, fraude, uso abusivo, riesgos de seguridad o incumplimiento de estos terminos, procurando informar al club cuando la situacion lo permita.',
    ],
  },
  {
    title: '4. Reservas y disponibilidad',
    paragraphs: [
      'La disponibilidad mostrada depende de la informacion registrada por cada club. Al iniciar el checkout, el horario puede retenerse temporalmente durante el plazo indicado en pantalla. Si el pago no se completa dentro de ese plazo, la reserva puede expirar y el horario volver a estar disponible.',
      'La reserva solo se considera confirmada cuando el pago ha sido aprobado y Rapicancha muestra o comunica la confirmacion. Una sesion de pago pendiente no constituye confirmacion definitiva.',
    ],
  },
  {
    title: '5. Precio, cargo de servicio y pasarela de pago',
    paragraphs: [
      'Antes de pagar, el checkout informa el precio total de la reserva en la moneda aplicable. El total puede incorporar un cargo de servicio o administracion de Rapicancha por el uso de la plataforma y el procesamiento transaccional. Actualmente la comision de servicio de la plataforma corresponde al diez por ciento (10 %) del valor pagado por cada reserva, salvo que antes del pago se informe expresamente una condicion diferente.',
      'El cliente asume el cargo de servicio informado en el checkout. Este cargo puede cubrir, entre otros conceptos, infraestructura tecnologica, operacion de la reserva y costos asociados a la pasarela de pago. No se cobraran conceptos adicionales que no hayan sido informados antes de la confirmacion.',
      'Los pagos son procesados por proveedores externos, actualmente ePayco. El cliente tambien queda sujeto a las condiciones operativas y de seguridad de la pasarela seleccionada. Rapicancha no almacena los datos completos de tarjetas ni las credenciales financieras del cliente.',
    ],
  },
  {
    title: '6. Cancelaciones, devoluciones y retracto',
    paragraphs: [
      'Si el club cancela la reserva, no puede prestar el servicio o confirma que la cancha no esta disponible, el club sera responsable de devolver al cliente la totalidad del dinero pagado. Rapicancha podra facilitar tecnicamente la solicitud y trazabilidad de la devolucion a traves de la pasarela.',
      'Si la cancelacion es solicitada por el cliente, se aplicara la politica de cancelacion informada por el club y los derechos irrenunciables previstos en la legislacion de consumo. Ninguna politica del club puede limitar el derecho de retracto, la reversion del pago o cualquier otra proteccion que resulte legalmente aplicable.',
      'Cuando proceda legalmente el retracto o una devolucion total, esta comprendera las sumas que deban reintegrarse conforme a la ley, sin descuentos prohibidos. Los tiempos de reflejo del dinero pueden depender del medio de pago y de la entidad financiera.',
    ],
  },
  {
    title: '7. Obligaciones del club',
    paragraphs: [
      'El club debe mantener actualizados su identidad, contacto, ubicacion, precios, horarios, disponibilidad y politicas; prestar el servicio ofrecido; atender reclamaciones; realizar las devoluciones a su cargo; cumplir las normas de consumo, tributarias, deportivas, sanitarias y de seguridad; y proteger los datos personales a los que acceda.',
      'El club no puede publicar informacion falsa, cobrar valores distintos a los informados, utilizar Rapicancha para actividades ilicitas ni trasladar al cliente cargos que no aparezcan claramente antes del pago.',
    ],
  },
  {
    title: '8. Obligaciones del cliente',
    paragraphs: [
      'El cliente debe suministrar informacion veraz, utilizar un medio de pago autorizado, verificar los datos de la reserva, cumplir las reglas razonables del club y abstenerse de realizar pagos fraudulentos, reservas especulativas o conductas que afecten la plataforma o a terceros.',
    ],
  },
  {
    title: '9. Comunicaciones y datos personales',
    paragraphs: [
      'Rapicancha puede enviar mensajes necesarios para ejecutar la reserva, confirmar pagos, informar cambios o atender solicitudes, de acuerdo con las autorizaciones otorgadas y la ley. Las comunicaciones promocionales son opcionales y pueden rechazarse.',
      'Los datos se utilizan para operar la cuenta, la reserva, el pago, el soporte y las obligaciones legales. La autorizacion para recibir confirmaciones por WhatsApp y la autorizacion de marketing se solicitan por separado.',
    ],
  },
  {
    title: '10. Disponibilidad y responsabilidad',
    paragraphs: [
      'Rapicancha procura mantener la plataforma disponible y segura, pero puede realizar mantenimientos o experimentar interrupciones de proveedores externos. Nada en estos terminos excluye responsabilidades que no puedan limitarse legalmente ni reduce los derechos del consumidor.',
      'El club responde directamente por la prestacion deportiva. Rapicancha responde por sus propias obligaciones como operador de la plataforma y por las funciones que controle directamente, dentro de los limites permitidos por la ley.',
    ],
  },
  {
    title: '11. Cambios y ley aplicable',
    paragraphs: [
      'Rapicancha puede actualizar estos terminos por cambios legales, operativos o funcionales. La nueva version indicara su fecha de vigencia y, cuando corresponda, se solicitara una nueva aceptacion.',
      'Estos terminos se interpretan conforme a las leyes de la Republica de Colombia. El cliente conserva el derecho de presentar reclamaciones ante el club, Rapicancha, la pasarela de pago o las autoridades competentes, segun corresponda.',
    ],
  },
]

export function TermsAndConditionsPage() {
  return <Box component="main" sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 68px)', pb: { xs: 6, md: 10 } }}>
    <Box sx={{ bgcolor: 'primary.dark', color: 'common.white', py: { xs: 5, md: 8 } }}>
      <Container maxWidth="md">
        <Typography color="secondary.main" sx={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Informacion legal</Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 46, md: 56 }, fontWeight: 950, lineHeight: 1.05, mt: 1.25 }}>Terminos y condiciones</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.72)', fontSize: { xs: 15, sm: 17 }, lineHeight: 1.65, mt: 2, maxWidth: 720 }}>
          Condiciones para clubes que contratan el SaaS y clientes que reservan servicios deportivos en Rapicancha.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: 13, mt: 2 }}>Version {CURRENT_TERMS_VERSION} - Vigentes desde el 27 de julio de 2026</Typography>
      </Container>
    </Box>

    <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 } }}>
      <Box sx={{ bgcolor: 'action.hover', borderLeft: 4, borderColor: 'secondary.main', px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Typography sx={{ fontWeight: 950 }}>Resumen esencial</Typography>
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {[
            'Los clubes pagan una suscripcion mensual segun el plan contratado.',
            'Cada reserva puede incluir una comision de servicio informada antes del pago.',
            'El total puede incorporar los costos de procesamiento de la pasarela.',
            'Si el club cancela o no presta el servicio, debe devolver el dinero al cliente.',
          ].map((item) => <Stack direction="row" key={item} spacing={1} sx={{ alignItems: 'flex-start' }}><CheckCircleOutlined color="primary" sx={{ flexShrink: 0, fontSize: 19, mt: 0.15 }} /><Typography color="text.secondary" sx={{ fontSize: 14.5, lineHeight: 1.55 }}>{item}</Typography></Stack>)}
        </Stack>
      </Box>

      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        {sections.map((section, index) => <Box component="section" key={section.title} sx={{ pb: 4 }}>
          {index > 0 && <Divider sx={{ mb: 4 }} />}
          <Typography component="h2" sx={{ fontSize: { xs: 20, sm: 23 }, fontWeight: 950 }}>{section.title}</Typography>
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {section.paragraphs.map((paragraph) => <Typography color="text.secondary" key={paragraph} sx={{ fontSize: { xs: 14.5, sm: 16 }, lineHeight: 1.75 }}>{paragraph}</Typography>)}
          </Stack>
        </Box>)}
      </Box>

      <Divider />
      <Stack spacing={1.25} sx={{ py: 4 }}>
        <Typography sx={{ fontWeight: 950 }}>Contacto</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          Para solicitudes relacionadas con Rapicancha, escribe por WhatsApp al{' '}
          <MuiLink href="https://wa.me/573148632751" rel="noreferrer" target="_blank">+57 314 863 2751</MuiLink>.
          Para asuntos propios de una reserva tambien puedes contactar directamente al club prestador.
        </Typography>
      </Stack>
      <Button component={Link} startIcon={<ArrowBackOutlined />} to="/" variant="outlined">Volver al inicio</Button>
    </Container>
  </Box>
}
