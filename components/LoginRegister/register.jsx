import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

function RegisterForm() {
    const [formData, setFormData] = useState({
        login_name: '',
        password: '',
        first_name: '',
        last_name: '',
        retypePassword: '',
        location: '',
        description: '',
        occupation: ''
    });

    let navigate = useNavigate();

    const [errors, setErrors] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { login_name, password, retypePassword } = formData;

        // Validation: check if username and password are non-empty
        if (!login_name || !password) {
            setErrors('Username and password are required.');
            return;
        }

        // Validation: check if passwords match
        if (password !== retypePassword) {
            setErrors('Passwords do not match.');
            return;
        }

        setErrors('');

        // Prepare data for POST request
        try {
            const response = await fetch('/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('User registered successfully!');
                setFormData({
                    login_name: '',
                    password: '',
                    retypePassword: '',
                    location: '',
                    description: '',
                    occupation: ''
                });
                navigate("/");
            } 
            
            else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while registering.');
        }
    };

    return (
        <div>
            <h2>Register</h2>
            {errors && <p style={{ color: 'red' }}>{errors}</p>}
            <form className='form-container' onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        name="login_name"
                        value={formData.login_name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Retype Password:</label>
                    <input
                        type="password"
                        name="retypePassword"
                        value={formData.retypePassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>First Name:</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Last Name:</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Location:</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Occupation:</label>
                    <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default RegisterForm;
