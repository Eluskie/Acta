import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Meeting } from '@shared/schema';

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 8,
    textAlign: 'center',
  },
  actaNumber: {
    fontSize: 8,
    color: '#9ca3af',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    marginBottom: 12,
  },
  divider: {
    width: 180,
    height: 2,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 'auto',
    marginTop: 12,
  },
  meetingInfo: {
    marginTop: 40,
    marginBottom: 40,
    textAlign: 'justify',
    lineHeight: 1.8,
  },
  attendeesBox: {
    marginVertical: 32,
    backgroundColor: '#f9fafb',
    border: '1pt solid #e5e7eb',
    borderRadius: 4,
    padding: 24,
  },
  attendeesTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    letterSpacing: 1.5,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  attendeesText: {
    fontSize: 10,
    color: '#374151',
  },
  content: {
    marginVertical: 32,
    textAlign: 'justify',
    lineHeight: 1.8,
  },
  paragraph: {
    marginBottom: 16,
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  heading: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    marginTop: 24,
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 8,
    marginLeft: 20,
  },
  signatures: {
    marginTop: 120,
    paddingTop: 60,
    borderTop: '2pt solid #d1d5db',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBlock: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '2pt solid #9ca3af',
    height: 80,
    marginBottom: 12,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    letterSpacing: 1.2,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
});

interface ActaPDFProps {
  meeting: Meeting;
  buildingName: string;
}

// Simple HTML parser for actaContent
const parseHTMLContent = (html: string) => {
  if (!html) return [];

  // Remove outer paragraph wrapper if present
  let content = html.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');

  const elements: any[] = [];
  let key = 0;

  // Split by major tags
  const parts = content.split(/(<[^>]+>.*?<\/[^>]+>|<br\s*\/?>)/g);

  for (let part of parts) {
    if (!part || part.trim() === '') continue;

    // Handle headings
    if (part.match(/<h3[^>]*>/)) {
      const text = part.replace(/<[^>]+>/g, '');
      elements.push(
        <Text key={key++} style={styles.heading}>
          {text}
        </Text>
      );
    }
    // Handle bold text
    else if (part.includes('<strong>')) {
      const segments = part.split(/(<strong>.*?<\/strong>)/g);
      const textElements: any[] = [];

      segments.forEach((seg, i) => {
        if (seg.match(/<strong>/)) {
          const text = seg.replace(/<[^>]+>/g, '');
          textElements.push(
            <Text key={`${key}-${i}`} style={styles.bold}>
              {text}
            </Text>
          );
        } else if (seg && seg.trim()) {
          textElements.push(seg.replace(/<[^>]+>/g, ''));
        }
      });

      if (textElements.length > 0) {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {textElements}
          </Text>
        );
      }
    }
    // Handle line breaks
    else if (part.match(/<br\s*\/?>/)) {
      elements.push(<Text key={key++}>{'\n'}</Text>);
    }
    // Handle regular text
    else {
      const text = part.replace(/<[^>]+>/g, '').trim();
      if (text) {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {text}
          </Text>
        );
      }
    }
  }

  return elements;
};

export default function ActaPDF({ meeting, buildingName }: ActaPDFProps) {
  const meetingDate = meeting?.date ? new Date(meeting.date) : new Date();

  const formattedDateLong = meetingDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = meetingDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const contentElements = parseHTMLContent(meeting.actaContent || '');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.actaNumber}>
            ACTA OFICIAL NO. {meeting?.id || new Date().getFullYear() + '-' + Math.floor(Math.random() * 100)}
          </Text>
          <Text style={styles.title}>ACTA DE REUNIÓN</Text>
          <View style={styles.divider} />
        </View>

        {/* Meeting Info */}
        <View style={styles.meetingInfo}>
          <Text>
            En <Text style={styles.bold}>{buildingName}</Text>, a{' '}
            <Text style={styles.bold}>{formattedDateLong}</Text>, siendo las{' '}
            <Text style={styles.bold}>{formattedTime} horas</Text>, se reúne el
            comité de administración del Edificio {buildingName}.
          </Text>
        </View>

        {/* Attendees */}
        {meeting?.attendeesCount && (
          <View style={styles.attendeesBox}>
            <Text style={styles.attendeesTitle}>ASISTENTES</Text>
            <Text style={styles.attendeesText}>
              Total de asistentes: {meeting.attendeesCount} personas.
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {contentElements.length > 0 ? (
            contentElements
          ) : (
            <Text style={styles.paragraph}>
              Contenido del acta no disponible.
            </Text>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatures} fixed>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FIRMA PRESIDENTE</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FIRMA SECRETARIA</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
