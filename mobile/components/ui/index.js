import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';

/* ── Button ─────────────────────────────────────────────────── */
export const Button = ({ children, variant='primary', size='md', loading=false, disabled=false, onPress, style }) => (
  <TouchableOpacity
    style={[btnS.base, btnS[`sz_${size}`], btnS[`v_${variant}`], (disabled||loading) && btnS.disabled, style]}
    onPress={onPress} disabled={disabled||loading} activeOpacity={0.82}
  >
    {loading
      ? <ActivityIndicator color={variant==='primary'?'white':colors.primary} size="small"/>
      : <Text style={[btnS.txt, btnS[`tv_${variant}`], btnS[`ts_${size}`]]}>{children}</Text>
    }
  </TouchableOpacity>
);

const btnS = StyleSheet.create({
  base:        { borderRadius:radii.full, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:spacing[2] },
  sz_sm:       { paddingHorizontal:spacing[4], paddingVertical:spacing[2] },
  sz_md:       { paddingHorizontal:spacing[6], paddingVertical:spacing[3] },
  sz_lg:       { paddingHorizontal:spacing[8], paddingVertical:spacing[4], minHeight:54 },
  v_primary:   { backgroundColor:colors.primary, ...shadows.md },
  v_outlined:  { backgroundColor:'transparent', borderWidth:1.5, borderColor:colors.primary },
  v_ghost:     { backgroundColor:'transparent' },
  v_light:     { backgroundColor:'white', ...shadows.sm },
  v_secondary: { backgroundColor:colors.secondary, ...shadows.md },
  disabled:    { opacity:0.5 },
  txt:         { fontWeight:'700', letterSpacing:0.2 },
  tv_primary:  { color:'white' },
  tv_outlined: { color:colors.primary },
  tv_ghost:    { color:colors.onSurface },
  tv_light:    { color:colors.primary },
  tv_secondary:{ color:'white' },
  ts_sm:       { fontSize:fontSizes.xs },
  ts_md:       { fontSize:fontSizes.base },
  ts_lg:       { fontSize:fontSizes.lg },
});

/* ── Badge ───────────────────────────────────────────────────── */
export const Badge = ({ children, variant='default', style }) => (
  <View style={[badgeS.base, badgeS[`v_${variant}`], style]}>
    <Text style={[badgeS.txt, badgeS[`tv_${variant}`]]}>{children}</Text>
  </View>
);

const badgeS = StyleSheet.create({
  base:       { borderRadius:radii.full, paddingHorizontal:spacing[3], paddingVertical:3, alignSelf:'flex-start' },
  v_default:  { backgroundColor:colors.primaryFixed },
  v_success:  { backgroundColor:colors.secondaryFixed },
  v_active:   { backgroundColor:colors.secondaryContainer },
  v_error:    { backgroundColor:colors.errorContainer },
  v_warning:  { backgroundColor:colors.tertiaryFixed },
  txt:        { fontSize:fontSizes.xs, fontWeight:'800', letterSpacing:0.8, textTransform:'uppercase' },
  tv_default: { color:colors.primary },
  tv_success: { color:colors.secondary },
  tv_active:  { color:colors.onSecondaryContainer },
  tv_error:   { color:colors.onErrorContainer },
  tv_warning: { color:colors.onTertiaryFixed },
});

/* ── Card ────────────────────────────────────────────────────── */
export const Card = ({ children, style }) => (
  <View style={[cardS.base, style]}>{children}</View>
);

const cardS = StyleSheet.create({
  base: { backgroundColor:colors.surfaceContainerLowest, borderRadius:radii.xl, padding:spacing[5], ...shadows.sm },
});

/* ── Typography helpers ──────────────────────────────────────── */
export const Heading = ({ children, style }) => (
  <Text style={[typoS.heading, style]}>{children}</Text>
);
export const BodyText = ({ children, style, muted=false }) => (
  <Text style={[typoS.body, muted && typoS.muted, style]}>{children}</Text>
);
export const Label = ({ children, style }) => (
  <Text style={[typoS.label, style]}>{children}</Text>
);

const typoS = StyleSheet.create({
  heading: { fontSize:fontSizes['2xl'], fontWeight:'800', color:colors.primary, letterSpacing:-0.5, lineHeight:fontSizes['2xl']*1.2 },
  body:    { fontSize:fontSizes.base, color:colors.onSurface, lineHeight:fontSizes.base*1.6 },
  muted:   { color:colors.onSurfaceVariant },
  label:   { fontSize:fontSizes.xs, fontWeight:'700', color:colors.outline, textTransform:'uppercase', letterSpacing:1.2 },
});

/* ── Divider ─────────────────────────────────────────────────── */
export const Divider = ({ label, style }) => (
  <View style={[divS.row, style]}>
    <View style={divS.line}/>
    {label && <Text style={divS.txt}>{label}</Text>}
    {label && <View style={divS.line}/>}
  </View>
);

const divS = StyleSheet.create({
  row:  { flexDirection:'row', alignItems:'center', gap:spacing[3] },
  line: { flex:1, height:1, backgroundColor:colors.outlineVariant+'4D' },
  txt:  { fontSize:fontSizes.xs, fontWeight:'600', color:colors.outline, textTransform:'uppercase', letterSpacing:1 },
});