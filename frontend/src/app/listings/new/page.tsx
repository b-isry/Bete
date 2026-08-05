"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Icon,
  ImageDropzone,
  Input,
  RequireRole,
  Select,
  Textarea,
  useToast,
  type ImageDropzoneItem,
} from "@/components/ui";
import { LocationPicker } from "@/components/property/LocationPicker";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  aiWriteDescription,
  ApiError,
  createProperty,
  type PropertyCreatePayload,
} from "@/lib/api";
import { useCategories, useCities } from "@/lib/hooks";
import { mockAiDescription } from "@/lib/mocks";

export default function NewListingPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { push } = useToast();

  const { data: citiesData } = useCities(locale);
  const { data: categoriesData } = useCategories(locale);
  const cities = citiesData?.items ?? [];
  const categories = categoriesData?.items ?? [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dealType, setDealType] = useState<"SALE" | "RENT">("SALE");
  const [propertyType, setPropertyType] = useState<
    "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL"
  >("APARTMENT");
  const [price, setPrice] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [locationText, setLocationText] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [images, setImages] = useState<ImageDropzoneItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    if (!cityId && cities[0]) {
      setCityId(String(cities[0].id));
    }
  }, [cities, cityId]);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  async function onWriteForMe() {
    setAiBusy(true);
    try {
      const result = await aiWriteDescription({
        title: title || "Property",
        location_text: locationText || "Addis Ababa",
        property_type: propertyType,
      });
      setDescription(result.description);
      push(t("listings.new.aiDone"), "success");
    } catch {
      setDescription(
        mockAiDescription({
          title: title || "Property",
          location_text: locationText || "Addis Ababa",
          property_type: propertyType,
        }),
      );
      push(t("listings.new.aiFallback"), "info");
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const uploaded = images.filter(
      (img) => img.status === "done" && img.image_url && img.image_hash,
    );
    if (uploaded.length === 0) {
      push(t("listings.new.needImages"), "error");
      return;
    }
    if (images.some((img) => img.status === "uploading")) {
      push(t("upload.waitForUploads"), "error");
      return;
    }
    if (!coords) {
      push(t("location.needPin"), "error");
      return;
    }
    if (!locationText.trim()) {
      push(t("location.needAddress"), "error");
      return;
    }
    if (!cityId || !categoryId) {
      push(t("listings.new.error"), "error");
      return;
    }

    const payload: PropertyCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      deal_type: dealType,
      property_type: propertyType,
      price: price.trim(),
      location_text: locationText.trim(),
      lat: coords.lat,
      lng: coords.lng,
      city_id: Number(cityId),
      category_id: Number(categoryId),
      images: uploaded.map((img) => ({
        image_url: img.image_url as string,
        image_hash: img.image_hash as string,
      })),
    };

    if (areaSqm.trim()) payload.area_sqm = areaSqm.trim();
    if (bedrooms.trim()) payload.bedrooms = Number(bedrooms);
    if (bathrooms.trim()) payload.bathrooms = Number(bathrooms);

    setBusy(true);
    try {
      const result = await createProperty(payload);
      push(t("listings.new.success"), "success");
      router.push(`/properties/${result.property.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("listings.new.error");
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireRole role="SELLER" fallbackHref="/sign-in">
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
        {t("listings.new.eyebrow")}
      </p>
      <h1 className="mb-2 font-serif text-headline-md text-primary">
        {t("listings.new.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("listings.new.subtitle")}
      </p>

      <Card>
        <form className="space-y-8" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("listings.new.fields.title")}
            </span>
            <Input
              variant="underline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
            />
          </label>

          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.description")}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={aiBusy}
                onClick={() => {
                  void onWriteForMe();
                }}
              >
                <Icon name="auto_awesome" />
                {t("listings.new.writeForMe")}
              </Button>
            </div>
            <Textarea
              variant="underline"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.dealType")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={dealType}
                onChange={(e) =>
                  setDealType(e.target.value as "SALE" | "RENT")
                }
              >
                <option value="SALE">{t("search.buy")}</option>
                <option value="RENT">{t("search.rent")}</option>
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.propertyType")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(
                    e.target.value as
                      | "HOUSE"
                      | "APARTMENT"
                      | "LAND"
                      | "COMMERCIAL",
                  )
                }
              >
                <option value="APARTMENT">
                  {t("propertyTypes.APARTMENT")}
                </option>
                <option value="HOUSE">{t("propertyTypes.HOUSE")}</option>
                <option value="LAND">{t("propertyTypes.LAND")}</option>
                <option value="COMMERCIAL">
                  {t("propertyTypes.COMMERCIAL")}
                </option>
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.price")}
              </span>
              <Input
                variant="underline"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500000"
                required
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.area")}
              </span>
              <Input
                variant="underline"
                inputMode="decimal"
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
                placeholder="120"
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.bedrooms")}
              </span>
              <Input
                variant="underline"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.bathrooms")}
              </span>
              <Input
                variant="underline"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </label>
          </div>

          <LocationPicker
            value={{
              lat: coords?.lat ?? null,
              lng: coords?.lng ?? null,
              location_text: locationText,
            }}
            onChange={(next) => {
              setCoords({ lat: next.lat, lng: next.lng });
              setLocationText(next.location_text);
            }}
            label={t("listings.new.fields.location")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("filters.city")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                required
                disabled={cities.length === 0}
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.category")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={categories.length === 0}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <ImageDropzone
            value={images}
            onChange={setImages}
            category="PROPERTY_IMAGE"
            max={10}
            label={t("listings.new.fields.photos")}
            hint={t("listings.new.photosHint")}
          />

          <div className="flex flex-wrap gap-3 border-t border-outline-variant pt-6">
            <Button type="submit" variant="primary" disabled={busy}>
              {t("listings.new.submit")}
            </Button>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("listings.new.pendingNote")}
            </p>
          </div>
        </form>
      </Card>
    </div>
    </RequireRole>
  );
}
