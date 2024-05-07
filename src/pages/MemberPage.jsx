import {
  Avatar,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Title,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from "../styles/MemberPage.module.css";
import { useDisclosure } from "@mantine/hooks";
import EditMemberModal from "../components/EditMemberModal";
import MemberPersonalInfo from "../components/MemberPersonalInfo";
import { AuthContext } from "../contexts/AuthContext";
import MemberEvents from "../components/MemberEvents";
import CreateEventModal from "../components/CreateEventModal";

//Image imports
const no_gender_photo = "../assets/images/no_photo.png";

const MemberPage = () => {
  const { memberId } = useParams();
  const [memberDetails, setMemberDetails] = useState({});
  const [activeTab, setActiveTab] = useState("PersonalInfo");
  const { isLoggedIn, user } = useContext(AuthContext);

  // Handle member's personal info update modal
  let [opened, { open, close }] = useDisclosure(false);
  const editPersonalInfoModal = { opened, open, close };

  // Handle event modal
  [opened, { open, close }] = useDisclosure(false);
  const createEventModal = { opened, open, close };

  const fetchMemberDetails = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${memberId}`
      );
      if (response.ok) {
        const responseData = await response.json();
        setMemberDetails(responseData);
      } else {
        const errorResponse = await response.json();
        throw new Error(errorResponse);
      }
    } catch (error) {
      console.error(
        "Error while fetching member details: ",
        JSON.stringify(error)
      );
      notifications.show({
        color: "red",
        title: "Oops! Something went wrong. Please try again.",
      });
    }
  };

  const updateMemberInfo = async (updateInfo, type) => {
    let apiCall;
    if (type === "personalInfo") {
      editPersonalInfoModal.close();
      apiCall = `${import.meta.env.VITE_API_URL}/api/users/${memberId}`;
    } else {
      apiCall = `${import.meta.env.VITE_API_URL}/api/users/skill/${memberId}`;
    }
    try {
      const response = await fetch(apiCall, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Berear ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(updateInfo),
      });
      if (response.ok) {
        const responseData = await response.json();
        setMemberDetails(responseData);
        notifications.show({
          color: "indigo",
          title: "Updated successfully",
        });
      } else {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message);
      }
    } catch (error) {
      console.error("Error while updating personal Info: ", error);
      notifications.show({
        color: "red",
        title:
          error.toString() ||
          "Oops! Something went wrong. Please try after sometime.",
      });
    }
  };

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  return (
    <>
      <Container fluid className={classes.ctn} pl={0} pr={0}>
        <Stack justify="space-between" gap={0}>
          <Paper h={rem(150)} radius={0} bg="#4A5167"></Paper>
          <Paper h={rem(450)} radius={0}>
            <Group justify="center" align="flex-start">
              <Paper
                h={450}
                w={250}
                bg="#AE5A00"
                style={{
                  position: "relative",
                  top: "-4rem",
                  backgroundColor: "#AE5A00",
                }}
              >
                <Avatar
                  src={
                    memberDetails.photo ? memberDetails.photo : no_gender_photo
                  }
                  size={170}
                  fit="cover"
                  radius={100}
                  fallbacksrc="https://placehold.co/600x400?text=Placeholder"
                  style={{
                    border: "10px solid black",
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <Stack
                  h={rem(150)}
                  justify="space-between"
                  align="center"
                  gap={3}
                  style={{ width: "100%", position: "absolute", top: "52%" }}
                >
                  <Stack gap={2}>
                    <Title order={3}>{memberDetails.fullName}</Title>
                    <Text>{memberDetails.email}</Text>
                  </Stack>
                  {user?.userId === memberId && isLoggedIn && (
                    <>
                      <Button onClick={editPersonalInfoModal.open}>
                        Edit Profile
                      </Button>
                      <Button onClick={createEventModal.open}>
                        Create Event
                      </Button>
                    </>
                  )}
                </Stack>
              </Paper>
              <Paper
                h="100%"
                w="70%"
                mt={10}
                style={{
                  position: "relative",
                  top: "-2.85rem",
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={setActiveTab}
                  classNames={{
                    tab: classes.tab,
                  }}
                >
                  <Tabs.List>
                    <Tabs.Tab value="PersonalInfo">Personal Info</Tabs.Tab>
                    <Tabs.Tab value="Events">Events</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="PersonalInfo">
                    <MemberPersonalInfo
                      memberDetails={memberDetails}
                      updateMemberInfo={updateMemberInfo}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="Events">
                    <MemberEvents memberId={memberId} />
                  </Tabs.Panel>

                  <Tabs.Panel value="Event"></Tabs.Panel>
                  <Tabs.Panel value="messages">Messages tab content</Tabs.Panel>
                </Tabs>
              </Paper>
            </Group>
          </Paper>
        </Stack>
      </Container>

      {/* Update member modal */}
      <Modal
        padding="lg"
        radius="xl"
        opened={editPersonalInfoModal.opened}
        onClose={editPersonalInfoModal.close}
        size="lg"
        title="Personal Information"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <EditMemberModal
          userDetails={memberDetails}
          updateMemberInfo={updateMemberInfo}
        />
      </Modal>

      {/* Update member modal */}
      <Modal
        padding="lg"
        radius="xl"
        opened={createEventModal.opened}
        onClose={createEventModal.close}
        size="lg"
        title="Personal Information"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <CreateEventModal userDetails={memberDetails} />
      </Modal>
    </>
  );
};

export default MemberPage;
