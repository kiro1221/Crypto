const handleErrors = err => {
    console.log(err.message, err.code);
    let errors = { password: "", username: "", email: ""};
    if (err.message === "incorrect username") {
        errors.username = "Incorrect username";
    }

    if (err.message === "incorrect password") {
        errors.password = "Incorrect password";
    }
    if (err.message === "User not found") {
        errors.username = "User not found";
    }
    if (err.message === "incorrect email") {
        errors.email = "Incorrect email";
    }
    if (err.message === "Passwords do not match") {
        errors.password = "Passwords do not match";
    }
    if (err.code === 11000) {
        const duplicateField = Object.keys(err.keyValue)[0];
        if (duplicateField === "username") {
            errors.username = "Username already taken";
        }
        return errors;
    }

    if (err.message.includes("User validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }
    return errors;
};
module.exports = { handleErrors };