import { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { AuthContext } from "../contexts/AuthContext.jsx";

import {
  Image,
  Container,
  Space,
  Button,
  Avatar,
  Box,
  Title,
  Text,
  Flex,
} from "@mantine/core";
import no_user_icon from "../assets/images/no_user_icon.png";

// Style imports
import classes from "../styles/EventDetailPage.module.css";

const EventDetailPage = () => {
  // Get event id from url
  const { id } = useParams();
  // Hook to keep event information
  const [event, setEvent] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("no date available");
  const [attendees, setAttendees] = useState([]);

  // Subscribe to the AuthContext to gain access to
  // the values from AuthContext.Provider `value` prop
  const { isLoggedIn, user } = useContext(AuthContext);

  // Hook to know if user is attending event
  const [isAttending, setIsAttending] = useState(false);

  // Fetch the event from from DB
  const fetchEvent = async () => {
    let apiEndPoint = `${import.meta.env.VITE_API_URL}/api/events/${id}`;
    try {
      const response = await fetch(apiEndPoint);
      if (response.ok) {
        const responseData = await response.json();
        if (responseData && responseData.attendees) {
          // Store event information in Event hook
          setEvent(responseData);
          // Store attendees informationin Attendees hook
          setAttendees(responseData.attendees);
          const eventDate = new Date(responseData.startingTime);
          // Stores event date in Date format
          setDate(eventDate);
          // If user is logged in, that is, user is true
          if (user) {
            // Check is logged user is attending, store in Attending hook
            setIsAttending(responseData.attendees.includes(user.userId));
          }
        } else {
          console.error("Attendees data is missing");
          // Handle the error or set a default value
          setAttendees([]); // Setting a default empty array if attendees are missing
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error while fetching event:", error);
      notifications.show({
        color: "red",
        title: "Fetch error",
        message: `Error fetching event: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function add current user to the list of attendees, and to update attendees list in the front-end and in the database
  const updateAttendees = () => {
    console.log("Adding current user to the list of attendees...");

    // Add current user to the list of attendees (Attendess hook), and update isAttending as true
    const updatedAttendees = [...attendees, user.userId];
    // Optimistic updating
    //  setAttendees(updatedAttendees);
    //  setIsAttending(true);

    // Get token from local storage
    const storedToken = localStorage.getItem("authToken");

    if (!storedToken) {
      notifications.show({
        color: "red",
        title: "Authorization Error",
        message: "Authentication token is missing.",
      });
      return;
    }

    // Put to event
    let apiEndPoint = `${import.meta.env.VITE_API_URL}/api/events/${id}`;
    // Updating only attendee array information
    const updatedData = { attendees: updatedAttendees };

    // PUT request to update
    const requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updatedData),
    };

    fetch(apiEndPoint, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update the event");
        }
        return response.json(); // Convert the response to JSON
      })
      .then((data) => {
        console.log("Event updated successfully:", data);
        setAttendees(updatedAttendees);
        setIsAttending(true);
      })
      .catch((error) => {
        console.error("Error updating the event:", error);
      });
  };

  // Function removing the current user from the list of attendees, in front and back (database)
  const leaveEvent = () => {
    console.log("Removing current user from list of attendees...");

    // Get token from local storage
    const storedToken = localStorage.getItem("authToken");

    // Make sure that token and even are available
    if (!storedToken || !event) {
      notifications.show({
        color: "red",
        title: "Authorization or Event Error",
        message: "Authentication token or event data is missing.",
      });
      return;
    }

    // API endpoint
    const apiEndPoint = `${import.meta.env.VITE_API_URL}/api/events/${
      event._id
    }`;

    // Filter out the current user's userId
    const updatedAttendees = event.attendees.filter(
      (userId) => userId !== user.userId
    );

    // Prepare information to be updated
    const updatedData = { attendees: updatedAttendees };

    const requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updatedData),
    };

    fetch(apiEndPoint, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update the event");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Event updated successfully:", data);
        setAttendees(updatedAttendees);
        setIsAttending(false);
      })
      .catch((error) => {
        console.error("Error updating the event:", error);
      });
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  if (isLoading)
    return <Container className={classes.loader}>Loading...</Container>;
  if (!event)
    return (
      <Container className={classes.error}>
        No event data found or there was an error.
      </Container>
    );

  return (
    <Container fluid className={classes.mainContainer}>
      <Flex className={classes.header}>
        <Flex className={classes.textHeader}>
          <Title className={classes.title}>{event.title}</Title>
          <Flex className={classes.hostSection}>
            <Image
              radius="md"
              w="50px"
              src={no_user_icon}
              alt="Host icon"
              className={classes.userPicture}
            />
            <div className={classes.hostInfo}>
              <Text size="sm">Hosted by:</Text>
              <Link to={`/user/${event.hostId._id}`} className={classes.link}>
                <Text size="md" fw={700}>
                  {event.hostId.firstName} {event.hostId.lastName}
                </Text>
              </Link>
            </div>
          </Flex>
        </Flex>
        <Button
          onClick={() => (isAttending ? leaveEvent() : updateAttendees())}
          disabled={!isLoggedIn || user.userId === event.hostID}
          variant={isAttending ? "outline" : "filled"}
        >
          {isAttending ? "Leave" : "Join"}
        </Button>
      </Flex>
      <Flex className={classes.eventInformation}>
        <Image
          w="50%"
          radius="md"
          src={event.imageUrl}
          alt="Event photo"
          className={classes.eventImage}
        />
        <Flex direction="column" className={classes.eventDetails}>
          <Text size="lg">{event.description}</Text>
          <Space h="md" />
          <Text size="sm">
            Starting time:{" "}
            <strong>
              {date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </Text>
          <Space h="md" />
          <Text size="sm">
            Duration: <strong>{event.duration}</strong>
          </Text>
        </Flex>
      </Flex>
      <Flex className={classes.attendeesInformation}>
        <Text size="sm">Attendees ({attendees.length}):</Text>
        <Flex>
          {attendees.map((attendee, idx) => (
            <div
              key={idx}
              className={`${classes.attendeeInformation} ${
                attendee === user.userId ? classes.attendeeHighlighted : ""
              }`}
            >
              <Avatar size="lg" alt={attendee} />
              <Link to={`/user/${attendee}`} className={classes.link}>
                <Box className={classes.attendeeBox}>
                  <Text truncate="end" size="xs" fw={600}>
                    {attendee}
                  </Text>
                </Box>
              </Link>
            </div>
          ))}
        </Flex>
        <Text>
          User: {user && user.userId}. Logged? {isLoggedIn ? "yes" : "no"} User
          Attending? {isAttending ? "yes" : "no"}
        </Text>
      </Flex>
    </Container>
  );
};

export default EventDetailPage;