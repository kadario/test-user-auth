import {
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  type SyntheticEvent,
  type ChangeEvent,
} from "react";

//*** Types:
interface CreateUserFormProps {
  setUserWasCreated: Dispatch<SetStateAction<boolean>>;
}

//***Global consts:
const API_URL =
  "https://api.challenge.hennge.com/password-validation-challenge-api/001/challenge-signup";
const AUTH_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsieWVsbG93aG91c2VAbWFpbC5ydSJdLCJpc3MiOiJoZW5uZ2UtYWRtaXNzaW9uLWNoYWxsZW5nZSIsInN1YiI6ImNoYWxsZW5nZSJ9.i0IRyTXVl5bmR_PM43eOJpXGR3M8oA1D7XJgjFYr8r8";

const errorValidationOptions = {
  username_min: 3,
  too_short: 10,
  too_long: 24,
  no_whitespace: /\s/,
  missing_digits: /[0-9]/,
  missing_uppercase: /[A-Z]/,
  missing_lowercase: /[a-z]/,
};

const errorMessages: { [key: string]: string } = {
  username_min: `Username must be at least ${errorValidationOptions.username_min} characters long`,
  username_required: "Username is required",
  password_required: "Password is required",
  too_short: `Password must be at least ${errorValidationOptions.too_short} characters long`,
  too_long: `Password must be at most ${errorValidationOptions.too_long} characters long`,
  no_whitespace: "Password cannot contain spaces",
  missing_digits: "Password must contain at least one number",
  missing_uppercase: "Password must contain at least one uppercase letter",
  missing_lowercase: "Password must contain at least one lowercase letter",
  not_allowed:
    "Sorry, the entered password is not allowed, please try a different one.",
  not_authorized: "Not authenticated to access this resource.",
  invalid_request: "Something went wrong, please try again.",
};

//*** Component:
const CreateUserForm = ({ setUserWasCreated }: CreateUserFormProps) => {
  const [formData, setFormData] = useState({
    Username: "",
    Password: "",
  });

  const [formErrors, setFormErrors] = useState({
    UsernameError: [],
    PasswordError: [],
  });

  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [sendingForm, setSendingForm] = useState(false);

  //*** Errors checkers:
  const serverErrorsToMessages = (errors: string[]): string[] =>
    errors.map((error: string) => errorMessages[error]);

  const requiredVlidation = (name: string, value: string): string[] => {
    const errors: string[] = [];

    if (value.length === 0) {
      if (name === "Username") {
        errors.push(errorMessages.username_required);
      } else {
        errors.push(errorMessages.password_required);
      }
    }

    return errors;
  };

  const passwordValidation = (value: string): string[] => {
    const errors: string[] = [];

    if (value.length < errorValidationOptions.too_short) {
      errors.push(errorMessages.too_short);
    }

    if (value.length > errorValidationOptions.too_long) {
      errors.push(errorMessages.too_long);
    }

    if (errorValidationOptions.no_whitespace.test(value)) {
      errors.push(errorMessages.no_whitespace);
    }

    if (!errorValidationOptions.missing_digits.test(value)) {
      errors.push(errorMessages.missing_digits);
    }

    if (!errorValidationOptions.missing_uppercase.test(value)) {
      errors.push(errorMessages.missing_uppercase);
    }

    if (!errorValidationOptions.missing_lowercase.test(value)) {
      errors.push(errorMessages.missing_lowercase);
    }

    return errors;
  };

  const getClientErrors = (name: string, value: string): string[] => {
    // First - checking if all required fields a filled
    let errors = [...requiredVlidation(name, value)];

    // If not - showing required error, or skip this step
    if (errors.length > 0) return errors;

    // next - validate username field
    if (name === "Username") {
      if (value.length < errorValidationOptions.username_min) {
        errors.push(errorMessages.username_min);
      }

      return errors;
    }

    // And then - validate password
    errors = [...errors, ...passwordValidation(value)];

    return errors;
  };

  /**
   * Updates the form errors state with the errors found in the given field.
   * The method takes the name and value of the field as arguments.
   * It calls getClientErrors to get the errors for the given field,
   * and then updates the form errors state with the errors found.
   * @param name - The name of the field to validate.
   * @param value - The value of the field to validate.
   */
  const populateErrorsState = (name: string, value: string): void => {
    const errors = getClientErrors(name, value);

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [`${name}Error`]: errors,
    }));
  };

  /**
   * Resets all states to initial values.
   * It is used when the sending request is finished, successfully or not.
   * It resets the form data, form errors and server errors.
   */
  const resetStates = () => {
    setFormData({
      Username: "",
      Password: "",
    });
    setFormErrors({
      UsernameError: [],
      PasswordError: [],
    });
    setServerErrors([]);
  };

  /**
   * Highlights and focuses on the first invalid field in the form.
   * Iterates through all invalid fields, retrieving their names and values,
   * and updates the form errors state accordingly.
   *
   * @param formElement - The HTML form element to check for invalid fields.
   */
  const setInvalidFields = (formElement: HTMLFormElement) => {
    const invalidFields = formElement.querySelectorAll(":invalid");
    const firstInvalidField = invalidFields[0] as HTMLInputElement;

    firstInvalidField?.focus();
    invalidFields.forEach((item) => {
      const element = item as HTMLInputElement;
      const name = element.getAttribute("name");
      const value = element.value;

      if (name) populateErrorsState(name, value);
    });
  };

  /**
   * Submits the form data to the API.
   * If the response is 200, it resets the form states and sets the userWasCreated flag to true.
   * If the response is 401 or 403, it sets the "not_authorized" error message.
   * If the response is anything else, it maps the errors to messages and sets the serverErrors state.
   * If there is an error, it sets the serverErrors state with the error message.
   * @param formElement - The HTML form element to extract the data from.
   */
  const sendingRequest = async (formElement: HTMLFormElement) => {
    const username = formElement.Username?.value;
    const password = formElement.Password?.value;

    setServerErrors([]);

    const headers = {
      Authorization: AUTH_TOKEN,
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      username: username,
      password: password,
    });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: headers,
        body: body,
      });

      if (response.ok) {
        resetStates();
        setUserWasCreated(true);
      } else {
        if (response.status === 401 || response.status === 403) {
          setServerErrors([errorMessages.not_authorized]);
        } else {
          const json = await response.json();
          setServerErrors(serverErrorsToMessages(json.errors));
        }
      }

      setSendingForm(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : errorMessages.invalid_request;

      setServerErrors([errorMessage]);
      setSendingForm(false);
    }
  };

  //*** Handlers:
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    populateErrorsState(name, value);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.target as HTMLFormElement;
    const isNativeValid = formElement.checkValidity();
    const isFormValid = Object.values(formErrors).every((error) =>
      typeof error === "string" ? error === "" : error.length === 0
    );

    // comment this "if else" statement to check server errors
    if (isFormValid && isNativeValid) {
      setSendingForm(true);
      sendingRequest(formElement); // disabling form and showing spinner
    } else {
      setInvalidFields(formElement);
    }
  };

  //*** Render:
  return (
    <div style={formWrapper}>
      <Loader loading={sendingForm} />

      <form
        style={sendingForm ? formSending : form}
        onSubmit={handleSubmit}
        noValidate
      >
        {/** Server errors showing below: */}
        <ErrorsList errors={serverErrors} />

        {/* make sure the username and password are submitted */}
        {/* make sure the inputs have the accessible names of their labels */}
        <FormInput
          label="Username"
          name="Username"
          value={formData.Username}
          handleInputChange={handleInputChange}
          readOnly={sendingForm}
          errors={formErrors.UsernameError}
        />

        <FormInput
          label="Password"
          name="Password"
          type="password"
          value={formData.Password}
          handleInputChange={handleInputChange}
          readOnly={sendingForm}
          errors={formErrors.PasswordError}
        />

        <button
          disabled={sendingForm}
          type="submit"
          name="submit"
          style={formButton}
        >
          Create User
        </button>
      </form>
    </div>
  );
};

//***Form Input component
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readOnly: boolean;
  errors: string[];
}
const FormInput = ({
  label,
  name,
  type = "text",
  value,
  handleInputChange,
  readOnly,
  errors,
}: FormInputProps) => {
  return (
    <>
      <label style={formLabel}>{label}</label>
      <input
        type={type}
        name={name}
        required
        value={value}
        style={formInput}
        onChange={handleInputChange}
        readOnly={readOnly}
      />
      <ErrorsList errors={errors} />
    </>
  );
};

//***Errors List component
const ErrorsList = ({ errors }: { errors: string[] }) => {
  return (
    <>
      {errors.length > 0 && (
        <ul style={messagesError}>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </>
  );
};

//***Loader component
const Loader = ({ loading }: { loading: boolean }) => {
  return (
    <>
      {loading && (
        <>
          <style>
            {`@keyframes spin {
              0% {
                transform: translate(-50%, -50%) rotate(0deg);
              }
              100% {
                transform: translate(-50%, -50%) rotate(360deg);
              }
          }`}
          </style>
          <span style={loader}></span>
        </>
      )}
    </>
  );
};

//*** Export main component:
export { CreateUserForm };

//*** Styles:
const formWrapper: CSSProperties = {
  maxWidth: "500px",
  width: "80%",
  backgroundColor: "#efeef5",
  padding: "24px",
  borderRadius: "8px",
  position: "relative",
};

const form: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const formSending: CSSProperties = {
  ...form,
  opacity: "0.5",
};

const messagesError: CSSProperties = {
  listStyle: "none",
  fontSize: "0.85rem",
  color: "#ff0000",
  lineHeight: "1.8",
};

const formLabel: CSSProperties = {
  fontWeight: 700,
  textTransform: "capitalize",
};

const formInput: CSSProperties = {
  outline: "none",
  padding: "8px 16px",
  height: "40px",
  fontSize: "14px",
  backgroundColor: "#f8f7fa",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: "4px",
};

const formButton: CSSProperties = {
  outline: "none",
  borderRadius: "4px",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  backgroundColor: "#7135d2",
  color: "white",
  fontSize: "16px",
  fontWeight: 500,
  height: "40px",
  padding: "0 8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "8px",
  alignSelf: "flex-end",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
};

const loader: CSSProperties = {
  width: "48px",
  height: "48px",
  border: "5px solid #ffffff",
  borderBottomColor: "#7135d2",
  borderRadius: "50%",
  display: "inline-block",
  boxSizing: "border-box",
  animation: "spin 1s infinite linear",
  position: "absolute",
  top: "50%",
  left: "50%",
};
