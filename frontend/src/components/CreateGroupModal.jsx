import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Chip, Stack } from '@mui/material';
import UserSearch from './UserSearch';
import { createGroup } from '../services/groupService';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

export default function CreateGroupModal({ open, onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState([]);
    const [error, setError] = useState('');

    const handleAddMember = (user) => {
        if (!members.find(m => m.email === user.email)) {
            setMembers([...members, user]);
        }
    };

    const handleRemoveMember = (email) => {
        setMembers(members.filter(m => m.email !== email));
    };

    const handleSubmit = async () => {
        if (!groupName) {
            setError('Group name is required');
            return;
        }
        if (members.length === 0) {
            setError('Add at least one member');
            return;
        }
        try {
            const memberEmails = members.map(m => m.email);
            const newGroup = await createGroup(groupName, memberEmails);
            onGroupCreated(newGroup);
            onClose();
            setGroupName('');
            setMembers([]);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to create group');
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" mb={2}>
                    Create New Group
                </Typography>
                {error && <Typography color="error" mb={2}>{error}</Typography>}

                <TextField
                    fullWidth
                    label="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    margin="normal"
                />

                <Typography variant="subtitle2" mt={2} mb={1}>Add Members</Typography>
                <UserSearch onUserSelect={handleAddMember} />

                <Stack direction="row" spacing={1} flexWrap="wrap" mt={2} rowGap={1}>
                    {members.map((member) => (
                        <Chip
                            key={member.email}
                            label={member.name || member.full_name || member.email}
                            onDelete={() => handleRemoveMember(member.email)}
                        />
                    ))}
                </Stack>

                <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Create</Button>
                </Box>
            </Box>
        </Modal>
    );
}
