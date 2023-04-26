import {
  StyleSheet,
} from "react-native";

export const styles = StyleSheet.create({
  container: {
      flex: 1,
      paddingLeft: 16,
      paddingRight: 16,
      backgroundColor: "#ddd",
      alignItems: "center", // Add alignItems center
  },
  gradientBackground: {
      backgroundColor: "linear-gradient(90deg, rgba(200,0,0,1) 0%, rgba(148,35,48,1) 35%, rgba(221,221,221,1) 100%)"
  },
  centerContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: 32,
  },
  text: {
      color: "black",
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 36,
  },
  smallText: {
    color: "#333",
    fontSize: 18,
    marginTop: 36
  },
  largeText: {
    color: "#333",
    fontSize: 40
  },
  whiteText: {
    color: "white",
  },
  lightText: {
    fontWeight: "400",
  },
  centerText: {
    textAlign: "center",
  },
  clickable: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
  },
  inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 5,
      marginBottom: 20,
  },
  input: {
      flex: 1,
      height: 40,
      backgroundColor: "white",
      borderRadius: 5,
      paddingHorizontal: 10,
      color: "black",
  },
  dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
      marginBottom: 40,
  },
  dividerText: {
      color: "black",
      fontWeight: "900",
      textShadowColor: "white",
      textShadowRadius: 5,
      fontSize: 32,
      borderWidth: 1,
  },
  headerText: {
      color: "black",
      fontWeight: "bold",
      fontSize: 24,
      paddingHorizontal: 5,
      textDecorationLine: "underline",
  },
});
