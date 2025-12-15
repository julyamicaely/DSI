import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../components/Colors'

const { width } = Dimensions.get('window');

const COLORS = {
    blue: '#5D7CFA',
    darkerGray: '#666666',
    lightPeach: '#FFF5F0',
    lightPink: '#FFF0F5',
    lightBlue: '#EDF2FF',
    lightRed: '#FFEBEB' // For "Atividade Física" if needed, or stick to provided text
};

export default function LifeBeatAboutScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero Text Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroHeadline}>
                        Seu Cardioguia pessoal{'\n'}para um coração mais forte.
                    </Text>
                    <Text style={styles.heroSubtext}>
                        Monitore hábitos, defina metas e calcule seu risco cardiovascular com Hábitos Inteligentes.
                    </Text>
                </View>

                {/* Blue CTA Section */}
                <LinearGradient
                    colors={['#5D7CFA', '#7A92FA']} // Blue to slightly lighter blue
                    style={styles.ctaSection}
                >
                    {/* Decorative watermark */}
                    <Ionicons name="heart" size={200} color="rgba(255,255,255,0.05)" style={styles.ctaWatermark} />

                    <Text style={styles.ctaHeadline}>Dê o próximo passo na saúde do seu coração.</Text>
                    <Text style={styles.ctaBody}>
                        Cansado de apenas reagir à saúde? Com LifeBeat, você assume o controle e passa a prevenir.
                        Nosso aplicativo é sua ferramenta diária para monitorar, entender e reduzir proativamente o risco de doenças cardiovasculares.
                        {'\n\n'}
                        Transforme a complexidade da prevenção em ações simples e eficazes que se encaixam na sua rotina.
                    </Text>
                </LinearGradient>

                {/* "Como podemos ajudar?" Section */}
                <View style={styles.helpSection}>
                    <Text style={styles.helpHeadline}>Como podemos ajudar?</Text>
                    <Text style={styles.helpBody}>
                        Desenvolvemos este aplicativo para ser seu guia pessoal na jornada da saúde cardíaca.
                        Acreditamos que a prevenção começa com a informação e a ação diária.
                    </Text>
                </View>

                {/* "Escolha LifeBeat" Cards */}
                <View style={styles.chooseSection}>
                    <Text style={styles.chooseTitle}>Escolha <Text style={{ color: colors.red }}>LifeBeat</Text></Text>

                    {/* Card 1 */}
                    <View style={[styles.card, { backgroundColor: COLORS.lightPeach }]}>
                        <Text style={styles.cardTitle}>Previsão de Risco Personalizada:</Text>
                        <Text style={styles.cardBody}>
                            Utilizamos algoritmos baseados em dados clínicos para dar a você uma estimativa de risco cardiovascular.
                            Entenda onde você está e se precisa ligar o alerta. O conhecimento é o primeiro passo para a mudança!
                        </Text>
                    </View>

                    {/* Card 2 */}
                    <View style={[styles.card, { backgroundColor: COLORS.lightPink }]}>
                        <Text style={styles.cardTitle}>Definição de Metas Inteligentes:</Text>
                        <Text style={styles.cardBody}>
                            Não sabe por onde começar? Te ajudamos a estabelecer metas de saúde realistas e alcançáveis (exercícios, nutrição, sono e mais).
                            Conm nosso auxílio, você pode tomar as rédeas do seu próprio caminho.
                        </Text>
                    </View>
                </View>

                {/* "Hábitos Cruciais" */}
                <View style={styles.habitsSection}>
                    <Text style={styles.habitsHeadline}>
                        Acompanhamento de{'\n'}Hábitos Cruciais.
                    </Text>
                    <Text style={styles.habitsSubtext}>
                        Monitore todos os pilares de um coração saudável em um só lugar:
                    </Text>

                    <View style={styles.gridContainer}>
                        {/* Atividade Física */}
                        <View style={[styles.gridItem, { backgroundColor: colors.red }]}>
                            <Text style={[styles.gridTitle, { color: colors.white }]}>Atividade Física</Text>
                            <Text style={[styles.gridDesc, { color: colors.white }]}>Registre treinos, frequência e metas.</Text>
                        </View>

                        {/* Nutrição */}
                        <View style={[styles.gridItem, { backgroundColor: colors.lightBlue }]}>
                            <Text style={[styles.gridTitle, { color: colors.red }]}>Nutrição</Text>
                            <Text style={[styles.gridDesc, { color: colors.red }]}>Acompanhe a ingestão de alimentos chave.</Text>
                        </View>

                        {/* Sono */}
                        <View style={[styles.gridItem, { backgroundColor: COLORS.lightPink }]}>
                            <Text style={[styles.gridTitle, { color: COLORS.blue }]}>Sono</Text>
                            <Text style={[styles.gridDesc, { color: COLORS.blue }]}>Entenda a qualidade do seu descanso.</Text>
                        </View>

                        {/* Indicadores Vitais */}
                        <View style={[styles.gridItem, { backgroundColor: COLORS.blue }]}>
                            <Text style={[styles.gridTitle, { color: colors.white }]}>Indicadores Vitais</Text>
                            <Text style={[styles.gridDesc, { color: colors.white }]}>Registre dados importantes.</Text>
                        </View>
                    </View>
                </View>

                {/* Bridge Section */}
                <View style={styles.progressSection}>
                    <Text style={styles.progressHeadline}>Visualize seu Progresso.</Text>
                    <Text style={styles.progressBody}>
                        Acompanhe seu desempenho com gráficos fáceis de entender. Veja o impacto direto das suas mudanças de hábitos na sua estimativa de risco e mantenha-se motivado a longo prazo.
                    </Text>
                </View>

                {/* 7. Footer */}
                <View style={styles.footerSection}>
                    {/* Watermark Heart */}
                    <Ionicons name="heart" size={300} color="rgba(255,255,255,0.1)" style={styles.footerWatermark} />

                    <Text style={styles.footerHeadline}>Seu coração merece esse cuidado.</Text>
                    <Text style={styles.footerBody}>
                        Não deixe a saúde para amanhã. Baixe o LifeBeat hoje e comece a construir uma vida mais longa e saudável.
                        Sua jornada para um coração mais forte e uma vida com mais confiança começa aqui!
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    // 2. Hero
    heroSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: colors.white,
    },
    heroHeadline: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.blue,
        marginBottom: 8,
        lineHeight: 32,
    },
    heroSubtext: {
        fontSize: 16,
        color: COLORS.darkerGray,
        lineHeight: 22,
    },
    // 3. CTA Blue
    ctaSection: {
        paddingHorizontal: 20,
        paddingVertical: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    ctaWatermark: {
        position: 'absolute',
        right: -50,
        bottom: -50,
    },
    ctaHeadline: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 16,
    },
    ctaBody: {
        fontSize: 16,
        color: colors.white,
        lineHeight: 24,
    },
    // 4. Help
    helpSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    helpHeadline: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.blue, // Usually section headers match brand color or black
        marginBottom: 8,
    },
    helpBody: {
        fontSize: 16,
        color: COLORS.darkerGray // Assuming standard body darkerG        lineHeight: 24,
    },
    // 5. Choose LifeBeat Cards
    chooseSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    chooseTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        // Add subtle shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    cardBody: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    // 6. Habits Grid
    habitsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    habitsHeadline: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.blue,
        marginBottom: 4,
    },
    habitsSubtext: {
        fontSize: 16,
        color: COLORS.darkerGray,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%', // Approx half
        aspectRatio: 1, // Square
        borderRadius: 12,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    gridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    gridDesc: {
        fontSize: 12,
        textAlign: 'center',
    },
    // Progress (Bridge)
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    progressHeadline: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.red,
        marginBottom: 8,
    },
    progressBody: {
        fontSize: 16,
        color: COLORS.darkerGray,
        lineHeight: 22,
    },
    // 7. Footer
    footerSection: {
        backgroundColor: colors.red,
        paddingHorizontal: 20,
        paddingVertical: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    footerWatermark: {
        position: 'absolute',
        bottom: -50,
        left: '50%',
        marginLeft: -150, // center it loosely
    },
    footerHeadline: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 16,
        textAlign: 'center',
        zIndex: 1,
    },
    footerBody: {
        fontSize: 16,
        color: colors.white,
        textAlign: 'center',
        lineHeight: 24,
        zIndex: 1,
    },
});
