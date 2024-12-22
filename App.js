import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity, Switch } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, addDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth, firebase, db } from './config';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

//Login Screen
const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log('Logged in');
        navigation.replace('App');
      })
      .catch((error) => {
        console.log(error.message);
        Alert.alert('Login Failed', error.message);
      });
  };

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: email,
          name: "",
          dateOfBirth: "",
          favoriteCuisine: "",
          favorites: []
        });
        console.log("User registered and profile initialized.");
      })
      .catch((error) => {
        console.log(error.message);
        Alert.alert('Registration Failed', error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Book Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleRegister} />
    </View>
  );
};

const toggleFavorite = async (recipeId) => {
  const userRef = doc(db, "users", auth.currentUser?.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  let favorites = userData.favorites || [];
  
  if (favorites.includes(recipeId)) {
    favorites = favorites.filter(id => id !== recipeId);
  } else {
    favorites.push(recipeId);
  }
  
  await setDoc(userRef, { favorites }, { merge: true });
  return favorites;
};

//Profile Screen
const Profile = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState('');
  const [editedFavoriteCuisine, setEditedFavoriteCuisine] = useState('');
  const userID = auth.currentUser?.uid;

  useEffect(() => {
    if (!userID) return;
    
    const userDocRef = doc(db, 'users', userID);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setProfile(data);
        setEditedName(data.name || '');
        setEditedDateOfBirth(data.dateOfBirth || '');
        setEditedFavoriteCuisine(data.favoriteCuisine || '');
      } else {
        console.log("No such document!");
        Alert.alert("Error", "Profile not found!");
      }
    });

    return () => unsubscribe();
  }, [userID]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, "users", userID);
      await setDoc(docRef, {
        name: editedName,
        dateOfBirth: editedDateOfBirth,
        favoriteCuisine: editedFavoriteCuisine,
        email: auth.currentUser?.email
      }, { merge: true });
      
      setProfile({
        ...profile,
        name: editedName,
        dateOfBirth: editedDateOfBirth,
        favoriteCuisine: editedFavoriteCuisine
      });
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {profile ? (
        <>
          <Text style={styles.title}>Profile</Text>
          
          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editedName}
                onChangeText={setEditedName}
              />
              <TextInput
                style={styles.input}
                placeholder="Date of Birth"
                value={editedDateOfBirth}
                onChangeText={setEditedDateOfBirth}
              />
              <TextInput
                style={styles.input}
                placeholder="Favorite Cuisine"
                value={editedFavoriteCuisine}
                onChangeText={setEditedFavoriteCuisine}
              />
              <View style={styles.buttonContainer}>
                <Button title="Save" onPress={handleSave} />
                <Button title="Cancel" onPress={() => setIsEditing(false)} color="gray" />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.itemDetail}>Name: {profile.name}</Text>
              <Text style={styles.itemDetail}>Email: {auth.currentUser?.email}</Text>
              <Text style={styles.itemDetail}>Date of Birth: {profile.dateOfBirth}</Text>
              <Text style={styles.itemDetail}>Favorite Cuisine: {profile.favoriteCuisine}</Text>
              <Button
                title="Edit Profile"
                onPress={() => setIsEditing(true)}
              />
            </>
          )}
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

const EditProfile = ({ navigation }) => {
  const userID = auth.currentUser?.uid;
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [favoriteCuisine, setFavoriteCuisine] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "users", userID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || '');
        setDateOfBirth(data.dateOfBirth || '');
        setFavoriteCuisine(data.favoriteCuisine || '');
      }
    };
    fetchProfile();
  }, [userID]);

  const handleUpdateProfile = async () => {
    try {
      const docRef = doc(db, "users", userID);
      await setDoc(docRef, {
        name,
        dateOfBirth,
        favoriteCuisine
      }, { merge: true });
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your date of birth"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />
      <TextInput
        style={styles.input}
        placeholder="Favorite Cuisine"
        value={favoriteCuisine}
        onChangeText={setFavoriteCuisine}
      />
      <Button title="Update Profile" onPress={handleUpdateProfile} />
    </View>
  );
};

//Add Recipe Screen
const AddRecipe = ({ navigation }) => {
  const [name, setName] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [directions, setDirections] = useState('');

  const add = async () => {
    try {
      const docRef = await addDoc(collection(db, "recipes"), {
        name: name,
        preparationTime: preparationTime,
        difficulty: difficulty,
        ingredients: ingredients,
        directions: directions,
      });
      console.log("Document written with ID: ", docRef.id);
      Alert.alert('Success', 'Recipe added!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Recipe</Text>
      <TextInput style={styles.input} placeholder="Recipe Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Preparation Time" value={preparationTime} onChangeText={setPreparationTime} />
      <TextInput style={styles.input} placeholder="Difficulty" value={difficulty} onChangeText={setDifficulty} />
      <TextInput style={styles.input} placeholder="Ingredients" value={ingredients} onChangeText={setIngredients} multiline />
      <TextInput style={styles.input} placeholder="Directions" value={directions} onChangeText={setDirections} multiline />
      <Button title="Add Recipe" onPress={add} />
    </View>
  );
};

//Home Screen
const Home = ({ navigation }) => {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const recipesRef = collection(db, "recipes");
    const unsubscribeRecipes = onSnapshot(recipesRef, (snapshot) => {
      const recipesArray = [];
      snapshot.forEach((doc) => {
        recipesArray.push({ id: doc.id, ...doc.data() });
      });
      setRecipes(recipesArray);
    });

    const userRef = doc(db, "users", auth.currentUser?.uid);
    const unsubscribeFavorites = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setFavorites(docSnapshot.data()?.favorites || []);
      }
    });

    return () => {
      unsubscribeRecipes();
      unsubscribeFavorites();
    };
  }, []);

  const handleToggleFavorite = async (recipeId) => {
    const newFavorites = await toggleFavorite(recipeId);
    setFavorites(newFavorites);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe List</Text>
      
      <View style={styles.filterContainer}>
        <Text>Show Favorites Only</Text>
        <Switch
          value={showFavoritesOnly}
          onValueChange={setShowFavoritesOnly}
          trackColor={{ false: "#767577", true: "#f4511e" }}
          thumbColor={showFavoritesOnly ? "#f4511e" : "#f4f3f4"}
        />
      </View>

      <FlatList
        data={showFavoritesOnly ? recipes.filter(recipe => favorites.includes(recipe.id)) : recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('RecipeDetailScreen', { recipeID: item.id })}>
            <View style={styles.itemContainer}>
              <View style={styles.recipeHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                  <Text style={styles.heartIcon}>
                    {favorites.includes(item.id) ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemDetail}>Preparation Time: {item.preparationTime}</Text>
              <Text style={styles.itemDetail}>Difficulty: {item.difficulty}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

//Recipe Detail Screen
const RecipeDetail = ({ route, navigation }) => {
  const { recipeID } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete recipe document
              await deleteDoc(doc(db, "recipes", recipeID));
              
              // Remove from user favorites if exists
              const userRef = doc(db, "users", auth.currentUser?.uid);
              const userDoc = await getDoc(userRef);
              const userData = userDoc.data();
              if (userData.favorites?.includes(recipeID)) {
                const updatedFavorites = userData.favorites.filter(id => id !== recipeID);
                await setDoc(userRef, { favorites: updatedFavorites }, { merge: true });
              }
              
              Alert.alert("Success", "Recipe deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const recipeRef = doc(db, "recipes", recipeID);
    const unsubscribeRecipe = onSnapshot(recipeRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setRecipe(docSnapshot.data());
      }
    });

    const userRef = doc(db, "users", auth.currentUser?.uid);
    const unsubscribeFavorites = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const favorites = docSnapshot.data()?.favorites || [];
        setIsFavorite(favorites.includes(recipeID));
      }
    });

    return () => {
      unsubscribeRecipe();
      unsubscribeFavorites();
    };
  }, [recipeID]);

  const handleToggleFavorite = async () => {
    const newFavorites = await toggleFavorite(recipeID);
    setIsFavorite(newFavorites.includes(recipeID));
  };

  return (
    <View style={styles.container}>
      {recipe ? (
        <>
          <View style={styles.recipeHeader}>
            <Text style={styles.title}>{recipe.name}</Text>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Text style={styles.heartIcon}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.itemDetail}>Preparation Time: {recipe.preparationTime}</Text>
          <Text style={styles.itemDetail}>Difficulty: {recipe.difficulty}</Text>
          <Text style={styles.itemDetail}>Ingredients: {recipe.ingredients}</Text>
          <Text style={styles.itemDetail}>Directions: {recipe.directions}</Text>
          <View style={styles.buttonContainer}>
            <Button title="Edit Recipe" onPress={() => navigation.navigate('EditRecipeScreen', { recipeID, recipe })} />
            <Button title="Delete Recipe" onPress={handleDelete} color="red" />
          </View>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

//Edit Recipe Screen
const EditRecipe = ({ route, navigation }) => {
  const { recipeID, recipe } = route.params;
  const [name, setName] = useState(recipe.name);
  const [preparationTime, setPreparationTime] = useState(recipe.preparationTime);
  const [difficulty, setDifficulty] = useState(recipe.difficulty);
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [directions, setDirections] = useState(recipe.directions);

  const handleUpdate = async () => {
    try {
      await setDoc(doc(db, "recipes", recipeID), {
        name,
        preparationTime,
        difficulty,
        ingredients,
        directions,
      });
      Alert.alert('Success', 'Recipe updated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Recipe</Text>
      <TextInput style={styles.input} placeholder="Recipe Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Preparation Time" value={preparationTime} onChangeText={setPreparationTime} />
      <TextInput style={styles.input} placeholder="Difficulty" value={difficulty} onChangeText={setDifficulty} />
      <TextInput style={styles.input} placeholder="Ingredients" value={ingredients} onChangeText={setIngredients} multiline />
      <TextInput style={styles.input} placeholder="Directions" value={directions} onChangeText={setDirections} multiline />
      <Button title="Update Recipe" onPress={handleUpdate} />
    </View>
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{ ...tabBarOptions, ...screenOptions }}
  >
    <Tab.Screen 
      name="HomeTab" 
      component={Home}
      options={{
        title: 'Recipes',
        tabBarIcon: ({ color, size }) => (
          <Text style={{color, fontSize: size}}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="AddRecipeTab" 
      component={AddRecipe}
      options={{
        title: 'Add Recipe',
        tabBarIcon: ({ color, size }) => (
          <Text style={{color, fontSize: size}}>🍲</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

const StackNavigator = () => (
  <Stack.Navigator 
    screenOptions={screenOptions}
  >
    <Stack.Screen 
      name="TabHome" 
      component={TabNavigator} 
      options={{ title: 'Recipe Book' }}
    />
    <Stack.Screen 
      name="RecipeDetailScreen" 
      component={RecipeDetail} 
      options={{ title: 'Recipe Details' }}
    />
    <Stack.Screen 
      name="AddRecipeScreen" 
      component={AddRecipe} 
      options={{ title: 'Add Recipe' }}
    />
    <Stack.Screen 
      name="EditRecipeScreen" 
      component={EditRecipe} 
      options={{ title: 'Edit Recipe' }}
    />
  </Stack.Navigator>
);

const LogoutScreen = () => {
  return null;
};

const handleLogout = async (navigation) => {
  try {
    await signOut(auth);
    navigation.replace('Login');
  } catch (error) {
    console.error(error);
    Alert.alert('Logout Failed', error.message);
  }
};

const DrawerNavigator = () => (
  <Drawer.Navigator 
    screenOptions={{ ...drawerOptions, ...screenOptions }}
  >
    <Drawer.Screen 
      name="HomeDrawer" 
      component={StackNavigator} 
      options={{ title: 'Home' }}
    />
    <Drawer.Screen 
      name="Profile" 
      component={Profile} 
      options={{ title: 'My Profile' }}
    />
    <Drawer.Screen
      name="Logout"
      component={LogoutScreen}
      options={{
        title: 'Logout',
        drawerIcon: () => <Text>🚪</Text>,
      }}
      listeners={({navigation}) => ({
        drawerItemPress: () => handleLogout(navigation)
      })}
    />
  </Drawer.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ title: 'Recipe Book Login' }}
        />
        <Stack.Screen 
          name="App" 
          component={DrawerNavigator} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const colors = {
  primary: '#6B9AC4',
  secondary: '#84B1D9',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#000000',
  textLight: '#95A5A6',
  error: '#E74C3C',
  success: '#2ECC71',
  border: '#E0E6ED'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  itemDetail: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heartIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }
});

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
    elevation: 0, // Android
    shadowOpacity: 0, // iOS
  },
  headerTintColor: colors.surface,
  headerTitleStyle: {
    fontWeight: '600',
  },
  cardStyle: { backgroundColor: colors.background },
};

const tabBarOptions = {
  style: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 0,
    height: 60,
    paddingBottom: 8,
  },
  activeTintColor: colors.primary,
  inactiveTintColor: colors.textLight,
};

const drawerOptions = {
  drawerStyle: {
    backgroundColor: colors.surface,
    width: 280,
  },
  drawerLabelStyle: {
    color: colors.text,
    fontSize: 16,
  },
  drawerActiveTintColor: colors.primary,
  drawerInactiveTintColor: colors.textLight,
};