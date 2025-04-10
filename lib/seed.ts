import { ID } from "react-native-appwrite";
import { databases, config } from "./appwrite";
import { agentImages, galleryImages, propertiesImages, reviewImages } from "./data";

const COLLECTIONS = {
  AGENT: config.agentsCollectionId,
  REVIEWS: config.reviewsCollectionId,
  GALLERY: config.galleriesCollectionId,
  PROPERTY: config.propertiesCollectionId,
};

const propertyTypes = [
  "House",
  "Townhouse",
  "Condo",
  "Duplex",
  "Studio",
  "Villa",
  "Apartment",
  "other",
];

const facilities = ["Laundry", "Parking", "Gym", "Wifi", "Pet-friendly"];

// Utility function to get a random subset from an array
function getRandomSubset<T>(array: T[], minItems: number, maxItems: number): T[] {
  if (minItems > maxItems) {
    throw new Error("minItems cannot be greater than maxItems");
  }
  if (minItems < 0 || maxItems > array.length) {
    throw new Error("minItems or maxItems are out of valid range for the array");
  }

  const subsetSize = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
  const arrayCopy = [...array];

  // Shuffle array
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[randomIndex]] = [arrayCopy[randomIndex], arrayCopy[i]];
  }

  return arrayCopy.slice(0, subsetSize);
}

// Main seeding function to populate all collections with sample data
async function seed() {
  try {
    console.log("Starting data seeding...");

    // Log config for confirmation
    console.log("Database ID:", config.databaseId);
    console.log("Agents Collection ID:", config.agentsCollectionId);
    console.log("Reviews Collection ID:", config.reviewsCollectionId);
    console.log("Galleries Collection ID:", config.galleriesCollectionId);
    console.log("Properties Collection ID:", config.propertiesCollectionId);

    if (!databases) {
      console.error("Appwrite databases client is not initialized.");
      return;
    }

    // Clear existing documents from each collection
    for (const key in COLLECTIONS) {
      try {
        const collectionId = COLLECTIONS[key as keyof typeof COLLECTIONS];
        const documents = await databases.listDocuments(
          config.databaseId!,
          collectionId!
        );

        for (const doc of documents.documents) {
          await databases.deleteDocument(config.databaseId!, collectionId!, doc.$id);
          await new Promise((resolve) => setTimeout(resolve, 200)); // Prevent rate limiting
        }

        console.log(`Cleared collection: ${key}`);
      } catch (error) {
        console.error(`Error clearing collection ${key}:`, error);
      }
    }

    console.log("Cleared all existing data.");

    // Seed Agents collection with 5 agents
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      try {
        const agent = await databases.createDocument(
          config.databaseId!,
          COLLECTIONS.AGENT!,
          ID.unique(),
          {
            name: `Agent ${i}`,
            email: `agent${i}@example.com`,
            avatar: agentImages[Math.floor(Math.random() * agentImages.length)],
          }
        );
        agents.push(agent);
        await new Promise((resolve) => setTimeout(resolve, 200)); // Delay to avoid rate limits
      } catch (error) {
        console.error(`Error creating agent ${i}:`, error);
      }
    }
    console.log(`Seeded ${agents.length} agents.`);

    // Seed Reviews collection with 20 reviews
    const reviews = [];
    for (let i = 1; i <= 20; i++) {
      try {
        const review = await databases.createDocument(
          config.databaseId!,
          COLLECTIONS.REVIEWS!,
          ID.unique(),
          {
            name: `Reviewer ${i}`,
            avatar: reviewImages[Math.floor(Math.random() * reviewImages.length)],
            review: `This is a review by Reviewer ${i}.`,
            rating: Math.floor(Math.random() * 5) + 1, // Rating between 1 and 5
          }
        );
        reviews.push(review);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error creating review ${i}:`, error);
      }
    }
    console.log(`Seeded ${reviews.length} reviews.`);

    // Seed Gallery collection with all gallery images
    const galleries = [];
    for (const image of galleryImages) {
      try {
        const gallery = await databases.createDocument(
          config.databaseId!,
          COLLECTIONS.GALLERY!,
          ID.unique(),
          { image }
        );
        galleries.push(gallery);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error("Error creating gallery:", error);
      }
    }
    console.log(`Seeded ${galleries.length} galleries.`);

    // Seed Properties collection with 20 properties
    for (let i = 1; i <= 20; i++) {
      try {
        const assignedAgent = agents[Math.floor(Math.random() * agents.length)];

        const assignedReviews = getRandomSubset(reviews, 5, 7); // 5 to 7 reviews
        const assignedGalleries = getRandomSubset(galleries, 3, 8); // 3 to 8 galleries

        const selectedFacilities = facilities
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * facilities.length) + 1);

        const image =
          propertiesImages.length - 1 >= i
            ? propertiesImages[i]
            : propertiesImages[Math.floor(Math.random() * propertiesImages.length)];

        const property = await databases.createDocument(
          config.databaseId!,
          COLLECTIONS.PROPERTY!,
          ID.unique(),
          {
            name: `Property ${i}`,
            type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
            description: `This is the description for Property ${i}.`,
            address: `123 Property Street, City ${i}`,
            geolocation: `192.168.1.${i}, 192.168.1.${i}`,
            price: Math.floor(Math.random() * 9000) + 1000,
            area: Math.floor(Math.random() * 3000) + 500,
            bedrooms: Math.floor(Math.random() * 5) + 1,
            bathrooms: Math.floor(Math.random() * 5) + 1,
            rating: Math.floor(Math.random() * 5) + 1,
            facilities: selectedFacilities,
            image: image,
            agent: assignedAgent.$id,
            reviews: assignedReviews.map((review) => review.$id),
            gallery: assignedGalleries.map((gallery) => gallery.$id),
          }
        );

        console.log(`Seeded property: ${property.name}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error creating property ${i}:`, error);
      }
    }

    console.log("Data seeding completed.");
  } catch (error) {
    console.error("Error in seed function:", error);
  }
}

export default seed;
