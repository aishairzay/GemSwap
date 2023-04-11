import { NavigationContainer } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./screens/Home";
import Vault from "./screens/Vault";
import CreateVault from "./screens/CreateVault";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootSiblingParent } from "react-native-root-siblings";
import ListVaults from "./screens/ListVaults";

export type RootStackParamList = {
    Home: undefined;
    Vault: { vaultID: String };
    CreateVault: undefined;
    ListVaults: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootLayout() {
    return (
        <RootSiblingParent>
            <RootLayoutNav />
        </RootSiblingParent>
    );
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: "transparent",
                        },
                        headerTransparent: true,
                        headerTintColor: "black",
                        headerTitleStyle: {
                            fontWeight: "bold",
                        },
                        headerTitle: "",
                    }}
                >
                    <Stack.Screen name="Home" component={Home} />
                    <Stack.Screen name="Vault" component={Vault} />
                    <Stack.Screen name="CreateVault" component={CreateVault} />
                    <Stack.Screen name="ListVaults" component={ListVaults} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
