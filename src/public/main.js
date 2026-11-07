
const getUsers = async () => {
    const usersContainer = document.getElementById("users");

    try {
        const response = await fetch("/api/users/getusers");

        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }

        const users = await response.json();

        usersContainer.innerHTML = "";

        users.forEach((user, index) => {
            const row = document.createElement("tr");

            const values = [
                index + 1,
                user.firstname,
                user.secondname,
                user.email
            ];

            values.forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value ?? "";
                row.appendChild(td);
            });

            usersContainer.appendChild(row);
        });

        if (users.length === 0) {
            usersContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        No users found.
                    </td>
                </tr>
            `;
        }

    } catch (error) {
        usersContainer.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    ${error.message}
                </td>
            </tr>
        `;
    }
};

getUsers();
