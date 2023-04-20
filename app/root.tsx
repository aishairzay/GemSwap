import { NavigationContainer } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./screens/Home";
import Vault from "./screens/EventHome";
import CreateVault from "./screens/CreateEvent";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootSiblingParent } from "react-native-root-siblings";
import ListVaults from "./screens/ListVaults";
import EventGate from "./screens/EventGate";
import EventHome from "./screens/EventHome";
import CreateEvent from "./screens/CreateEvent";

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
                    <Stack.Screen name="EventGate" component={EventGate} />
                    <Stack.Screen name="EventHome" component={EventHome} />
                    <Stack.Screen name="CreateEvent" component={CreateEvent} />
                    <Stack.Screen name="ListVaults" component={ListVaults} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
