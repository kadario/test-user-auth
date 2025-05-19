import { useState } from "react";
import { CreateUserForm } from "./CreateUserForm";

function App() {
  const [userWasCreated, setUserWasCreated] = useState(false);
  if (userWasCreated) {
    return <p>User was successfully created!</p>;
  }

  return <CreateUserForm setUserWasCreated={setUserWasCreated} />;
}

export default App;
