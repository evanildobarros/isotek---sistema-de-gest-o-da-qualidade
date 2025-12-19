import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { marked } from 'marked';

// Configurações de Estilo (CSS do PDF)
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#333'
    },
    coverPage: {
        marginTop: 80,
        alignItems: 'center',
        padding: 20
    },
    logo: {
        width: 150,
        marginBottom: 20
    },
    coverTitle: {
        fontSize: 28,
        color: '#025159',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10
    },
    coverSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40
    },
    footer: {
        marginTop: 40,
        fontSize: 9,
        color: '#999',
        textAlign: 'center',
        paddingTop: 10
    },
    tableContainer: {
        marginTop: 30
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 5
    },
    tableRow: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: '#fafafa'
    },
    col1: { width: '15%' },
    col2: { width: '25%' },
    col3: { width: '40%' },
    col4: { width: '20%' },
    tableText: { fontSize: 10 },
    h1: {
        fontSize: 20,
        color: '#025159',
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        paddingBottom: 5
    },
    h2: {
        fontSize: 16,
        color: '#025159',
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8
    },
    h3: {
        fontSize: 14,
        color: '#444',
        fontWeight: 'bold',
        marginTop: 10
    },
    paragraph: {
        marginBottom: 8,
        textAlign: 'justify'
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4,
        paddingLeft: 10
    },
    bullet: {
        width: 15,
        color: '#025159'
    },
    bold: {
        fontWeight: 'bold'
    }
});

interface ManualProps {
    content: string;
    companyName: string;
    companyLogo?: string | null;
    cnpj: string;
    docTitle?: string;
    docVersion?: string;
    docCode?: string;
}

// Parse inline text with bold support
const parseInlineText = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) ||
            (part.startsWith('__') && part.endsWith('__'))) {
            return <Text key={index} style={styles.bold}>{part.slice(2, -2)}</Text>;
        }
        return part;
    }).filter(p => p !== '');
};

// Markdown Renderer using marked lexer
const MarkdownRenderer = ({ content }: { content: string }) => {
    const cleanContent = content
        .replace(/\|[-:]+\|/g, '')
        .replace(/^\|.*\|$/gm, (match) => match.replace(/\|/g, ' ').trim());

    const tokens = marked.lexer(cleanContent);

    const renderTokens = (tokens: any[]): React.ReactNode[] => {
        return tokens.map((token: any, index: number) => {
            switch (token.type) {
                case 'heading':
                    const headingStyle = token.depth === 1 ? styles.h1 :
                        token.depth === 2 ? styles.h2 : styles.h3;
                    return <Text key={index} style={headingStyle}>{token.text}</Text>;

                case 'paragraph':
                    return (
                        <Text key={index} style={styles.paragraph}>
                            {parseInlineText(token.text)}
                        </Text>
                    );

                case 'list':
                    return (
                        <View key={index} style={{ marginBottom: 10 }}>
                            {token.items.map((item: any, i: number) => (
                                <View key={i} style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={{ flex: 1, fontSize: 11 }}>
                                        {parseInlineText(item.text)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    );

                case 'space':
                    return <View key={index} style={{ height: 6 }} />;

                default:
                    if ('text' in token && token.text) {
                        return <Text key={index} style={styles.paragraph}>{token.text}</Text>;
                    }
                    return null;
            }
        });
    };

    return <View>{renderTokens(tokens)}</View>;
};

export const QualityManualTemplate = ({
    content,
    companyName,
    companyLogo,
    cnpj,
    docTitle = 'MANUAL DA QUALIDADE',
    docVersion = '1.0',
    docCode = 'DOC-001'
}: ManualProps) => {
    return (
        <Document>
            {/* CAPA */}
            <Page style={styles.page}>
                <View style={styles.coverPage}>
                    {companyLogo && <Image src={companyLogo} style={styles.logo} />}
                    <Text style={styles.coverTitle}>{companyName}</Text>
                    <Text style={styles.coverSubtitle}>{docTitle}</Text>

                    <View style={{ marginTop: 20, padding: 20, width: '100%', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center', color: '#555' }}>Código: {docCode}</Text>
                        <Text style={{ textAlign: 'center', color: '#555', marginTop: 5 }}>Versão: {docVersion}</Text>
                        <Text style={{ textAlign: 'center', color: '#555', marginTop: 5 }}>CNPJ: {cnpj}</Text>
                        <Text style={{ textAlign: 'center', color: '#555', marginTop: 5 }}>
                            Data: {new Date().toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                </View>

                {/* TABELA DE REVISÕES */}
                <View style={styles.tableContainer}>
                    <Text style={{ fontSize: 14, color: '#025159', fontWeight: 'bold', marginBottom: 10 }}>
                        Histórico de Revisões
                    </Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.tableText, { fontWeight: 'bold' }]}>Rev.</Text>
                        <Text style={[styles.col2, styles.tableText, { fontWeight: 'bold' }]}>Data</Text>
                        <Text style={[styles.col3, styles.tableText, { fontWeight: 'bold' }]}>Descrição</Text>
                        <Text style={[styles.col4, styles.tableText, { fontWeight: 'bold' }]}>Aprovador</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.col1, styles.tableText]}>{docVersion}</Text>
                        <Text style={[styles.col2, styles.tableText]}>{new Date().toLocaleDateString('pt-BR')}</Text>
                        <Text style={[styles.col3, styles.tableText]}>Emissão Inicial do Sistema</Text>
                        <Text style={[styles.col4, styles.tableText]}>Diretoria</Text>
                    </View>
                </View>

                <Text style={styles.footer}>Documento Gerado Automaticamente pela Plataforma Isotek</Text>
            </Page>

            {/* CONTEÚDO */}
            <Page style={styles.page}>
                <View style={{ marginBottom: 20, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 9, color: '#025159' }}>{companyName} - {docTitle}</Text>
                </View>

                <MarkdownRenderer content={content} />

                <Text style={styles.footer}>Isotek SGQ - Documento Controlado</Text>
            </Page>
        </Document>
    );
};
