import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EditMeeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [locationType, setLocationType] = useState<"phone" | "zoom" | "teams" | "meet" | "in-person" | "custom" | "seeksy_studio">("zoom");
  const [locationDetails, setLocationDetails] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [meetingTypes, setMeetingTypes] = useState<any[]>([]);
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState<string>("");

  useEffect(() => {
    loadMeeting();
    loadMeetingTypes();
  }, [id]);

  const loadMeetingTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("meeting_types")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setMeetingTypes(data || []);
    } catch (error) {
      console.error("Error loading meeting types:", error);
    }
  };

  const loadMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Populate form fields
      setTitle(data.title);
      setDescription(data.description || "");
      setDate(new Date(data.start_time));
      
      // Extract time from start_time
      const meetingDate = new Date(data.start_time);
      const hours = meetingDate.getHours().toString().padStart(2, '0');
      const minutes = meetingDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      
      // Calculate duration
      const startTime = new Date(data.start_time);
      const endTime = new Date(data.end_time);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      setDuration(durationMinutes.toString());
      
      setLocationType(data.location_type);
      setLocationDetails(data.location_details || "");
      setAttendeeName(data.attendee_name);
      setAttendeeEmail(data.attendee_email);
      setAttendeePhone(data.attendee_phone || "");
      setSelectedMeetingTypeId(data.meeting_type_id || "");
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading meeting:", error);
      toast.error("Failed to load meeting");
      navigate("/meetings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }

    setSaving(true);

    try {
      // Combine date and time
      const [hours, minutes] = time.split(':');
      const startTime = new Date(date);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Calculate end time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(duration));

      const { error } = await supabase
        .from("meetings")
        .update({
          meeting_type_id: selectedMeetingTypeId || null,
          title,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location_type: locationType,
          location_details: locationDetails,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: attendeePhone || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Meeting updated successfully");
      navigate("/meetings");
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast.error("Failed to update meeting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Meeting</CardTitle>
          <CardDescription>Update meeting details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <Select value={selectedMeetingTypeId} onValueChange={setSelectedMeetingTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type</Label>
              <Select value={locationType} onValueChange={(value) => setLocationType(value as typeof locationType)}>
                <SelectTrigger id="locationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in-person">In Person</SelectItem>
                  <SelectItem value="seeksy_studio">Seeksy Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationDetails">Location Details</Label>
              <Input
                id="locationDetails"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="Meeting link, address, or phone number"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Attendee Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="attendeeName">Name *</Label>
                <Input
                  id="attendeeName"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeeEmail">Email *</Label>
                <Input
                  id="attendeeEmail"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeePhone">Phone</Label>
                <Input
                  id="attendeePhone"
                  type="tel"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/meetings")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
